"use client";

import React, { useState } from "react";
import { Button, Input, Typography, Select, App, Upload, Tooltip, Space, Spin, Row, Col, Switch, Flex } from "antd";
import { SwapOutlined, InboxOutlined, ClearOutlined } from "@ant-design/icons";
import { cleanLines, downloadFile, punctuationEndRegex, specialLineStartRegex, pureNumberRegex, getFileTypePresetConfig } from "@/app/utils";
import { useTextStats } from "@/app/hooks/useTextStats";
import { useCopyToClipboard } from "@/app/hooks/zh/useCopyToClipboard";
import { useZhText } from "@/app/hooks/zh/useZhText";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import useFileUpload from "@/app/hooks/useFileUpload";
import { createConverter } from "js-opencc";
import ZhResultCard from "@/app/components/zh/ZhResultCard";
import PageCard from "@/app/components/styled/PageCard";

const { TextArea } = Input;
const { Dragger } = Upload;

const uploadFileTypes = getFileTypePresetConfig("richText");

const cnLanguages = [
  { value: "cn", label: "简体中文" },
  { value: "tw", label: "繁体中文（台湾）" },
  { value: "twp", label: "繁体（台湾）且转换词汇" },
  { value: "hk", label: "繁体中文（香港）" },
  { value: "t", label: "繁体中文（OpenCC）" },
  { value: "jp", label: "日文新字体" },
];

const ClientPage = () => {
  const { message } = App.useApp();
  const { copyToClipboard } = useCopyToClipboard();
  const z = useZhText();

  const localizedCnLanguages = cnLanguages.map((lang) => ({ ...lang, label: z(lang.label) }));

  const { isFileProcessing, fileList, multipleFiles, readFile, sourceText, setSourceText, uploadMode, singleFileMode, setSingleFileMode, handleFileUpload, handleUploadRemove, handleUploadChange, resetUpload } = useFileUpload();
  const [result, setResult] = useState("");

  const sourceStats = useTextStats(sourceText);

  const [phraseConversion, setPhraseConversion] = useLocalStorage("chineseConversion_phraseConversion", false);
  const [directExport, setDirectExport] = useLocalStorage("chineseConversion_directExport", false);
  const [smartLineBreak, setSmartLineBreak] = useLocalStorage("chineseConversion_smartLineBreak", false);

  const [customFrom, setCustomFrom] = useLocalStorage("chineseConversion_customFrom", "cn");
  const [customTo, setCustomTo] = useLocalStorage("chineseConversion_customTo", "twp");

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
      message.error(z("请输入或粘贴待转换文本"));
      return;
    }
    const converter = await createConverter({ from: from as "cn" | "tw" | "twp" | "hk" | "t" | "jp", to: to as "cn" | "tw" | "twp" | "hk" | "t" | "jp" });
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
      message.success(z(`导出成功：${dfileName}`));
      return;
    }
    setResult(convertedText);
  };

  const handleMultipleConversion = async (from: string, to: string) => {
    if (multipleFiles.length === 0) {
      message.error(z("请先上传待处理文件"));
      return;
    }
    for (let i = 0; i < multipleFiles.length; i++) {
      const currentFile = multipleFiles[i];
      await new Promise<void>((resolve) => {
        readFile(currentFile, async (text) => {
          await handleConversion(from, to, text, currentFile.name);
          resolve();
        });
      });
    }
    message.success(z("处理完成，文件已自动下载"), 10);
  };

  const runQuick = (direction: "t2s" | "s2t") => {
    const fromLang = direction === "t2s" ? (phraseConversion ? "twp" : "t") : "cn";
    const toLang = direction === "t2s" ? "cn" : phraseConversion ? "twp" : "t";
    if (uploadMode === "single") handleConversion(fromLang, toLang, sourceText);
    else handleMultipleConversion(fromLang, toLang);
  };

  const handleCustomConversion = () => {
    if (customFrom === customTo) {
      message.warning(z("源语言和目标语言不能相同"));
      return;
    }
    if (uploadMode === "single") handleConversion(customFrom, customTo, sourceText);
    else handleMultipleConversion(customFrom, customTo);
  };

  return (
    <Spin spinning={isFileProcessing} description={z("请稍候...")} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Flex vertical gap="middle">
            <PageCard
              title={
                <Space>
                  <InboxOutlined /> {z("输入区")}
                </Space>
              }
              extra={
                <Tooltip title={z("清空输入内容和上传的文件")}>
                  <Button
                    type="text"
                    danger
                    onClick={() => {
                      resetUpload();
                      message.success(z("已清空"));
                    }}
                    icon={<ClearOutlined />}>
                    {z("清空")}
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
                <p className="ant-upload-text">{z("点击或拖拽文件到此处上传")}</p>
                <p className="ant-upload-hint">
                  {z("支持的格式：")}
                  {uploadFileTypes.formatLabel({ maxVisible: 8, separator: " " })}
                </p>
              </Dragger>
              {uploadMode === "single" && (
                <TextArea
                  placeholder={z("请输入或粘贴待转换文本...")}
                  value={sourceStats.isEditable ? sourceText : sourceStats.displayText}
                  onChange={sourceStats.isEditable ? (e) => setSourceText(e.target.value) : undefined}
                  rows={8}
                  allowClear
                  readOnly={!sourceStats.isEditable}
                  aria-label={z("输入区")}
                />
              )}
              {sourceText && (
                <Flex justify="end" className="mt-2">
                  <Typography.Text type="secondary" className="!text-xs">
                    {sourceStats.charCount} {z("字符")} / {sourceStats.lineCount} {z("行")}
                  </Typography.Text>
                </Flex>
              )}
            </PageCard>

            <Flex gap="small" wrap>
              <Button type="primary" size="large" block className="flex-1 !min-w-[140px]" onClick={() => runQuick("t2s")}>
                {z("繁➔简")}
              </Button>
              <Button type="primary" size="large" block className="flex-1 !min-w-[140px]" onClick={() => runQuick("s2t")}>
                {z("简➔繁")}
              </Button>
            </Flex>

            {result && (
              <ZhResultCard
                value={result}
                onChange={setResult}
                onCopy={() => copyToClipboard(result)}
                onExport={() => {
                  const fileName = handleExportFile(result);
                  message.success(z(`文件已导出：${fileName}`));
                }}
              />
            )}
          </Flex>
        </Col>

        <Col xs={24} md={8}>
          <Flex vertical gap="middle">
            <PageCard title={z("转换设置")}>
              <Flex vertical gap="small">
                <Flex justify="space-between" align="center">
                  <Tooltip title={z("同时转换台湾地区惯用词汇（如：视频↔影片、幼儿园↔幼稚園）")}>
                    <span>{z("转换地区词汇")}</span>
                  </Tooltip>
                  <Switch size="small" checked={phraseConversion} onChange={setPhraseConversion} />
                </Flex>
                <Flex justify="space-between" align="center">
                  <Tooltip title={z("自动合并断开的段落，优化排版")}>
                    <span>{z("智能换行")}</span>
                  </Tooltip>
                  <Switch size="small" checked={smartLineBreak} onChange={setSmartLineBreak} aria-label={z("智能换行")} />
                </Flex>
                <Flex justify="space-between" align="center">
                  <Tooltip title={z("每次只处理一个文件，上传新文件时自动替换")}>
                    <span>{z("单文件模式")}</span>
                  </Tooltip>
                  <Switch size="small" checked={singleFileMode} onChange={setSingleFileMode} aria-label={z("单文件模式")} />
                </Flex>
                {multipleFiles.length < 2 && (
                  <Flex justify="space-between" align="center">
                    <Tooltip title={z("转换完成后直接下载文件，跳过预览")}>
                      <span>{z("处理后自动导出")}</span>
                    </Tooltip>
                    <Switch size="small" checked={directExport} onChange={setDirectExport} aria-label={z("处理后自动导出")} />
                  </Flex>
                )}
              </Flex>
            </PageCard>

            <PageCard title={z("自定义语言")}>
              <Flex vertical gap="small">
                <Flex align="center" gap="small">
                  <Typography.Text type="secondary" className="!text-xs" style={{ minWidth: 40 }}>
                    {z("源语言")}
                  </Typography.Text>
                  <Select value={customFrom} onChange={setCustomFrom} options={localizedCnLanguages} className="flex-1" size="small" aria-label={z("自定义源语言")} />
                </Flex>
                <Flex align="center" gap="small">
                  <Typography.Text type="secondary" className="!text-xs" style={{ minWidth: 40 }}>
                    {z("目标语言")}
                  </Typography.Text>
                  <Select value={customTo} onChange={setCustomTo} options={localizedCnLanguages} className="flex-1" size="small" aria-label={z("自定义目标语言")} />
                </Flex>
                <Button block onClick={handleCustomConversion} icon={<SwapOutlined />}>
                  {z("自定义转换")}
                </Button>
              </Flex>
            </PageCard>
          </Flex>
        </Col>
      </Row>
    </Spin>
  );
};

export default ClientPage;
