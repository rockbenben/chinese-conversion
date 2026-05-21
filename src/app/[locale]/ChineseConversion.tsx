"use client";

import React, { useState } from "react";
import { Button, Typography, Select, App, Upload, Tooltip, Space, Spin, Row, Col, Switch, Flex } from "antd";
import { SwapOutlined, InboxOutlined, ClearOutlined } from "@ant-design/icons";
import { cleanLines, downloadFile, punctuationEndRegex, specialLineStartRegex, pureNumberRegex, getFileTypePresetConfig } from "@/app/utils";
import { useTextStats } from "@/app/hooks/useTextStats";
import { useCopyToClipboard } from "@/app/hooks/useCopyToClipboard";
import { useTranslations } from "next-intl";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import useFileUpload from "@/app/hooks/useFileUpload";
import { createConverter } from "js-opencc";
import ResultCard from "@/app/components/ResultCard";
import PageCard from "@/app/components/styled/PageCard";
import SourceArea from "@/app/components/SourceArea";
import { ProtectedRuleDrawer, ProtectedRulePanel, effectiveCount, type ProtectedRule } from "@/app/components/protectedRuleManager";

const { Dragger } = Upload;

const uploadFileTypes = getFileTypePresetConfig("richText");

// 哪一个 protectedDict（s2t / t2s）应在这次转换里生效。
// protectedDict 只在涉及简体（cn）的方向被应用；tw↔hk、t↔jp 等纯繁体间转换不适用。
const getProtectedDirection = (from: string, to: string): "s2t" | "t2s" | null => {
  if (from === "cn" && to !== "cn") return "s2t";
  if (to === "cn" && from !== "cn") return "t2s";
  return null;
};

const ChineseConversion = () => {
  const { message } = App.useApp();
  const { copyToClipboard } = useCopyToClipboard();
  const t = useTranslations("ChineseConversion");
  const tCommon = useTranslations("common");
  const tPR = useTranslations("ProtectedRuleManager");

  const localizedCnLanguages = [
    { value: "cn", label: t("langSimplified") },
    { value: "tw", label: t("langTaiwan") },
    { value: "twp", label: t("langTaiwanPhrase") },
    { value: "hk", label: t("langHongKong") },
    { value: "t", label: t("langOpenCC") },
    { value: "jp", label: t("langJapanese") },
  ];

  const { isFileProcessing, fileList, multipleFiles, readFile, sourceText, setSourceText, uploadMode, singleFileMode, setSingleFileMode, handleFileUpload, handleUploadRemove, handleUploadChange, resetUpload } = useFileUpload();
  const [result, setResult] = useState("");

  const sourceStats = useTextStats(sourceText);
  const resultStats = useTextStats(result);

  const [phraseConversion, setPhraseConversion] = useLocalStorage("chinese-conversion-phraseConversion", false);
  const [directExport, setDirectExport] = useLocalStorage("chinese-conversion-directExport", false);
  const [smartLineBreak, setSmartLineBreak] = useLocalStorage("chinese-conversion-smartLineBreak", false);

  const [customFrom, setCustomFrom] = useLocalStorage("chinese-conversion-customFrom", "cn");
  const [customTo, setCustomTo] = useLocalStorage("chinese-conversion-customTo", "twp");

  const [s2tRules, setS2tRules] = useLocalStorage<ProtectedRule[]>("chinese-conversion-protectedRules-s2t", []);
  const [t2sRules, setT2sRules] = useLocalStorage<ProtectedRule[]>("chinese-conversion-protectedRules-t2s", []);
  const [enableProtectedRules, setEnableProtectedRules] = useLocalStorage("chinese-conversion-enableProtectedRules", true);
  const [ruleDrawerOpen, setRuleDrawerOpen] = useState(false);

  const activeS2tCount = effectiveCount(s2tRules);
  const activeT2sCount = effectiveCount(t2sRules);

  const [prevSourceText, setPrevSourceText] = useState(sourceText);
  if (sourceText !== prevSourceText) {
    setPrevSourceText(sourceText);
    setResult("");
  }

  const handleExportFile = (text: string) => {
    const uploadFileName = multipleFiles[0]?.name;
    const fileName = uploadFileName || "jianfan.txt";
    downloadFile(text, fileName);
    return fileName;
  };

  const handleConversion = async (from: string, to: string, sourceText: string, fileName?: string) => {
    setResult("");
    if (!sourceText.trim()) {
      message.error(t("enterTextError"));
      return;
    }
    const direction = getProtectedDirection(from, to);
    const activeRules: ProtectedRule[] = enableProtectedRules ? (direction === "s2t" ? s2tRules : direction === "t2s" ? t2sRules : []) : [];
    const protectedDict: string[][] = activeRules.filter((r) => r.from && r.to).map((r) => [r.from, r.to]);

    try {
      const converter = await createConverter(
        { from: from as "cn" | "tw" | "twp" | "hk" | "t" | "jp", to: to as "cn" | "tw" | "twp" | "hk" | "t" | "jp" },
        protectedDict.length > 0 ? protectedDict : undefined
      );
      let convertedText = converter(sourceText);
      if (smartLineBreak) {
        const lines = cleanLines(convertedText, true);
        if (lines.length === 0) {
          convertedText = "";
        } else {
          convertedText = lines.reduce((merged, current, index, arr) => {
            if (index === 0) return current;
            const shouldAddNewline = punctuationEndRegex.test(arr[index - 1]) || pureNumberRegex.test(current) || pureNumberRegex.test(arr[index - 1]) || specialLineStartRegex.test(current);
            return merged + (shouldAddNewline ? "\n\n" : "") + current;
          }, "");
        }
      }

      if (fileName) {
        await downloadFile(convertedText, fileName);
        return;
      }
      if (directExport) {
        const dfileName = handleExportFile(convertedText);
        message.success(tCommon("exportSuccess", { fileName: dfileName }));
        return;
      }
      setResult(convertedText);
    } catch (err) {
      console.error("chinese-conversion failed", err);
      message.error(t("conversionFailed"));
    }
  };

  const handleMultipleConversion = async (from: string, to: string) => {
    if (multipleFiles.length === 0) {
      message.error(t("uploadFilesFirst"));
      return;
    }
    await Promise.all(
      multipleFiles.map(
        (currentFile) =>
          new Promise<void>((resolve) => {
            readFile(currentFile, async (text) => {
              await handleConversion(from, to, text, currentFile.name);
              resolve();
            });
          })
      )
    );
    message.success(tCommon("batchDownloaded"), 10);
  };

  const runQuick = (direction: "t2s" | "s2t") => {
    const fromLang = direction === "t2s" ? (phraseConversion ? "twp" : "t") : "cn";
    const toLang = direction === "t2s" ? "cn" : phraseConversion ? "twp" : "t";
    if (uploadMode === "single") handleConversion(fromLang, toLang, sourceText);
    else handleMultipleConversion(fromLang, toLang);
  };

  const handleCustomConversion = () => {
    if (customFrom === customTo) {
      message.warning(t("sameLangError"));
      return;
    }
    if (uploadMode === "single") handleConversion(customFrom, customTo, sourceText);
    else handleMultipleConversion(customFrom, customTo);
  };

  return (
    <Spin spinning={isFileProcessing} description={tCommon("pleaseWait")} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Flex vertical gap="middle">
            <PageCard
              title={
                <Space>
                  <InboxOutlined /> {tCommon("sourceArea")}
                </Space>
              }
              extra={
                <Tooltip title={tCommon("clearInputTooltip")}>
                  <Button
                    type="text"
                    danger
                    onClick={() => {
                      resetUpload();
                      message.success(tCommon("resetUploadSuccess"));
                    }}
                    icon={<ClearOutlined />}>
                    {tCommon("clearAll")}
                  </Button>
                </Tooltip>
              }>
              <Dragger
                customRequest={({ file }) => handleFileUpload(file as File)}
                accept={uploadFileTypes.accept}
                multiple={!singleFileMode}
                showUploadList
                beforeUpload={singleFileMode ? resetUpload : undefined}
                onRemove={handleUploadRemove}
                onChange={handleUploadChange}
                fileList={fileList}
                className="mb-2">
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">{tCommon("dragAndDropText")}</p>
                <p className="ant-upload-hint">
                  {tCommon("supportedFormats")}
                  {uploadFileTypes.formatLabel({ maxVisible: 8, separator: " " })}
                </p>
              </Dragger>
              {uploadMode === "single" && (
                <SourceArea
                  sourceText={sourceText}
                  setSourceText={setSourceText}
                  stats={sourceStats}
                  placeholder={tCommon("sourceTextPlaceholder")}
                  ariaLabel={tCommon("sourceArea")}
                />
              )}
            </PageCard>

            <Flex gap="small" wrap>
              <Button type="primary" size="large" block className="flex-1 !min-w-[140px]" onClick={() => runQuick("t2s")}>
                {tPR("directionT2s")}
              </Button>
              <Button type="primary" size="large" block className="flex-1 !min-w-[140px]" onClick={() => runQuick("s2t")}>
                {tPR("directionS2t")}
              </Button>
            </Flex>

            {result && (
              <ResultCard
                content={result}
                stats={resultStats}
                onChange={setResult}
                onCopy={() => copyToClipboard(result)}
                onExport={() => {
                  const fileName = handleExportFile(result);
                  message.success(t("exportedFile", { fileName }));
                }}
              />
            )}
          </Flex>
        </Col>

        <Col xs={24} md={8}>
          <Flex vertical gap="middle">
            <PageCard title={t("conversionSettings")}>
              <Flex vertical gap="small">
                <Flex justify="space-between" align="center">
                  <Tooltip title={t("phraseConversionTooltip")}>
                    <span>{t("phraseConversion")}</span>
                  </Tooltip>
                  <Switch size="small" checked={phraseConversion} onChange={setPhraseConversion} />
                </Flex>
                <Flex justify="space-between" align="center">
                  <Tooltip title={t("smartLineBreakTooltip")}>
                    <span>{tCommon("smartLineBreak")}</span>
                  </Tooltip>
                  <Switch size="small" checked={smartLineBreak} onChange={setSmartLineBreak} aria-label={tCommon("smartLineBreak")} />
                </Flex>
                <Flex justify="space-between" align="center">
                  <Tooltip title={tCommon("singleFileModeTooltip")}>
                    <span>{tCommon("singleFileMode")}</span>
                  </Tooltip>
                  <Switch size="small" checked={singleFileMode} onChange={setSingleFileMode} aria-label={tCommon("singleFileMode")} />
                </Flex>
                {multipleFiles.length < 2 && (
                  <Flex justify="space-between" align="center">
                    <Tooltip title={t("directExportTooltip")}>
                      <span>{tCommon("directExport")}</span>
                    </Tooltip>
                    <Switch size="small" checked={directExport} onChange={setDirectExport} aria-label={tCommon("directExport")} />
                  </Flex>
                )}
              </Flex>
            </PageCard>

            <PageCard title={t("customLanguage")}>
              <Flex vertical gap="small">
                <Flex vertical gap={4}>
                  <Typography.Text type="secondary" className="!text-xs">
                    {tCommon("sourceLanguage")}
                  </Typography.Text>
                  <Select value={customFrom} onChange={setCustomFrom} options={localizedCnLanguages} className="w-full" size="small" aria-label={t("customSourceLanguage")} />
                </Flex>
                <Flex vertical gap={4}>
                  <Typography.Text type="secondary" className="!text-xs">
                    {tCommon("targetLanguage")}
                  </Typography.Text>
                  <Select value={customTo} onChange={setCustomTo} options={localizedCnLanguages} className="w-full" size="small" aria-label={t("customTargetLanguage")} />
                </Flex>
                {getProtectedDirection(customFrom, customTo) === null && (activeS2tCount > 0 || activeT2sCount > 0) && (
                  <Typography.Text type="warning" className="!text-xs">
                    {t("customRulesNotActive")}
                  </Typography.Text>
                )}
                <Button block onClick={handleCustomConversion} icon={<SwapOutlined />}>
                  {t("customConvert")}
                </Button>
              </Flex>
            </PageCard>

            <ProtectedRulePanel
              enabled={enableProtectedRules}
              onEnabledChange={setEnableProtectedRules}
              s2tCount={activeS2tCount}
              t2sCount={activeT2sCount}
              onOpenDrawer={() => setRuleDrawerOpen(true)}
            />
          </Flex>
        </Col>
      </Row>
      <ProtectedRuleDrawer open={ruleDrawerOpen} onClose={() => setRuleDrawerOpen(false)} s2tRules={s2tRules} setS2tRules={setS2tRules} t2sRules={t2sRules} setT2sRules={setT2sRules} />
    </Spin>
  );
};

export default ChineseConversion;
