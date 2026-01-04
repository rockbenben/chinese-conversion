"use client";

import React, { useState } from "react";
import { Button, Input, Typography, Select, Form, App, Upload, Tooltip, Checkbox, Card, Space, Spin, Row, Col, Divider } from "antd";
import { SwapOutlined, CopyOutlined, InboxOutlined, DownloadOutlined, ClearOutlined, VerticalAlignBottomOutlined, VerticalAlignTopOutlined } from "@ant-design/icons";
import { cleanLines, downloadFile, punctuationEndRegex, specialLineStartRegex, pureNumberRegex } from "@/app/utils";
import { useTextStats } from "@/app/hooks/useTextStats";
import { useCopyToClipboard } from "@/app/hooks/zh/useCopyToClipboard";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import useFileUpload from "@/app/hooks/useFileUpload";
import * as OpenCC from "opencc-js";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Paragraph } = Typography;

const cnLanguages = [
  { value: "cn", label: "简体中文" },
  { value: "tw", label: "繁体中文（台湾）" },
  { value: "twp", label: "繁体（台湾）且转换词汇" },
  { value: "hk", label: "繁体中文（香港）" },
  { value: "t", label: "繁体中文（OpenCC）" },
  { value: "jp", label: "日文新字体" },
];

const DEFAULT_CN_SOURCE_LANG = "tw";
const DEFAULT_CN_TARGET_LANG = "cn";

const ClientPage = () => {
  const { message } = App.useApp();
  const { copyToClipboard } = useCopyToClipboard();

  const {
    isFileProcessing,
    fileList,
    multipleFiles,
    readFile,
    sourceText,
    setSourceText,
    uploadMode,
    singleFileMode,
    setSingleFileMode,
    handleFileUpload,
    handleUploadRemove,
    handleUploadChange,
    resetUpload,
  } = useFileUpload();
  const [largeMode, setLargeMode] = useState(false);
  const [result, setResult] = useState("");

  const sourceStats = useTextStats(sourceText);
  const resultStats = useTextStats(result);

  const [sourceCNLanguage, setSourceCNLanguage] = useLocalStorage("sourceCNLanguage", DEFAULT_CN_SOURCE_LANG);
  const [targetCNLanguage, setTargetCNLanguage] = useLocalStorage("targetCNLanguage", DEFAULT_CN_TARGET_LANG);
  const [directExport, setDirectExport] = useLocalStorage("chineseConversion_directExport", false);
  const [smartLineBreak, setSmartLineBreak] = useLocalStorage("chineseConversion_smartLineBreak", false);

  const [prevSourceText, setPrevSourceText] = useState(sourceText);
  if (sourceText !== prevSourceText) {
    setPrevSourceText(sourceText);
    setResult("");
  }

  const handleLanguageChange = (type: "source" | "target", value: string) => {
    // 获取另一个语言值
    const otherValue = type === "source" ? targetCNLanguage : sourceCNLanguage;

    // 如果源语言和目标语言相同
    if (value === otherValue) {
      const newValue = value === DEFAULT_CN_SOURCE_LANG ? DEFAULT_CN_TARGET_LANG : DEFAULT_CN_SOURCE_LANG;
      if (type === "source") {
        setSourceCNLanguage(value);
        setTargetCNLanguage(newValue);
      } else {
        setTargetCNLanguage(value);
        setSourceCNLanguage(newValue);
      }
      message.warning(`源语言和目标语言不能相同，已自动切换${type === "source" ? "目标" : "源"}语言为${newValue === DEFAULT_CN_TARGET_LANG ? "简体中文" : "繁体中文（台湾）"}`);
      return;
    }
    // 只有在值发生变化时才更新
    if (type === "source" && value !== sourceCNLanguage) {
      setSourceCNLanguage(value);
    } else if (type === "target" && value !== targetCNLanguage) {
      setTargetCNLanguage(value);
    }
  };

  const handleExportFile = (text: string) => {
    const uploadFileName = multipleFiles[0]?.name;
    const fileName = uploadFileName || "jianfan.txt";
    downloadFile(text, fileName);
    return fileName;
  };

  const handleConversion = async (from: string, to: string, sourceText: string, fileName?: string) => {
    setResult("");
    if (!sourceText.trim()) {
      message.error("请输入或粘贴待转换文本");
      return;
    }
    const converter = OpenCC.Converter({ from: from as "cn", to: to as "cn" });
    let convertedText = converter(sourceText);
    if (smartLineBreak) {
      // 分割文本，修剪每行并过滤空行
      const lines = cleanLines(convertedText, true);

      // 如果没有有效行，则将文本设为空
      if (lines.length === 0) {
        convertedText = "";
      } else {
        // 使用 reduce 合并行，根据上一行结尾是否为标点符号决定是否添加换行
        convertedText = lines.reduce((merged, current, index, arr) => {
          if (index === 0) return current;
          // 判断是否应该换行：上一行以标点结尾 或 当前行是纯数字行 或 上一行是纯数字行 或 当前行以特殊字符开头
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
      message.success(`导出成功：${dfileName}`);
      return;
    }

    setResult(convertedText);
  };

  const handleMultipleConversion = async (from: string, to: string) => {
    //const isValid = await validateTranslate();
    //if (!isValid) {
    //  return;
    //  }

    if (multipleFiles.length === 0) {
      message.error("请先上传待处理文件");
      return;
    }

    //setTranslateInProgress(true);
    //setProgressPercent(0);

    for (let i = 0; i < multipleFiles.length; i++) {
      const currentFile = multipleFiles[i];
      await new Promise<void>((resolve) => {
        readFile(currentFile, async (text) => {
          await handleConversion(from, to, text, currentFile.name);
          resolve();
        });
      });
    }

    //setTranslateInProgress(false);
    message.success("处理完成，文件已自动下载", 10);
  };

  return (
    <Spin spinning={isFileProcessing} tip="正在处理文件，请稍候..." size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={18}>
          <Card
            title="输入区"
            extra={
              <Space>
                <Tooltip title="清空输入内容和上传的文件">
                  <Button
                    type="text"
                    danger
                    onClick={() => {
                      resetUpload();
                      message.success("已清空");
                    }}
                    icon={<ClearOutlined />}>
                    清空
                  </Button>
                </Tooltip>
              </Space>
            }>
            <Dragger
              customRequest={({ file }) => handleFileUpload(file as File)}
              accept=".txt,.md,.markdown,.json,.srt,.ass,.vtt,.csv,.tsv,.xml,.yaml,.yml,.log,.ini,.html,.css,.js,.py,.java,.sql"
              multiple={!singleFileMode}
              showUploadList
              beforeUpload={singleFileMode ? resetUpload : undefined}
              onRemove={handleUploadRemove}
              onChange={handleUploadChange}
              fileList={fileList}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">支持的格式：.txt .md .json .srt .ass .vtt .csv .tsv .xml .yaml .yml .log .ini .html .css .js .py .java .sql</p>
            </Dragger>
            {uploadMode === "single" && !largeMode && (
              <TextArea
                placeholder="请输入或粘贴待转换文本..."
                value={sourceStats.isEditable ? sourceText : sourceStats.displayText}
                onChange={sourceStats.isEditable ? (e) => setSourceText(e.target.value) : undefined}
                rows={8}
                className="mt-1"
                allowClear
                readOnly={!sourceStats.isEditable}
                aria-label="输入区"
              />
            )}
            {sourceText && (
              <Paragraph type="secondary" className="mt-1 text-right">
                输入：{sourceStats.charCount} 字符 / {sourceStats.lineCount} 行
              </Paragraph>
            )}
          </Card>

          {result && (
            <Card
              title="处理结果"
              style={{ marginTop: "12px" }}
              extra={
                <Space wrap>
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(result)}>
                    复制
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      const fileName = handleExportFile(result);
                      message.success(`文件已导出：${fileName}`);
                    }}>
                    导出
                  </Button>
                </Space>
              }>
              <TextArea
                value={resultStats.displayText}
                onChange={!resultStats.isTooLong ? (e) => setResult(e.target.value) : undefined}
                rows={10}
                readOnly={resultStats.isTooLong}
                aria-label="处理结果"
              />
              <Paragraph type="secondary" className="mt-1">
                输出：{resultStats.charCount} 字符 / {resultStats.lineCount} 行
              </Paragraph>
            </Card>
          )}
        </Col>

        <Col xs={24} md={6}>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Card title="配置选项">
              <Form layout="vertical">
                <Form.Item label="源语言" style={{ marginBottom: 12 }}>
                  <Select
                    value={sourceCNLanguage}
                    onChange={(e) => handleLanguageChange("source", e)}
                    options={cnLanguages}
                    placeholder="请选择源语言"
                    style={{ width: "100%" }}
                    showSearch={{
                      optionFilterProp: "label",
                    }}
                    aria-label="源语言"
                  />
                </Form.Item>
                <Form.Item label="目标语言" style={{ marginBottom: 12 }}>
                  <Select
                    value={targetCNLanguage}
                    onChange={(e) => handleLanguageChange("target", e)}
                    options={cnLanguages}
                    placeholder="请选择目标语言"
                    style={{ width: "100%" }}
                    showSearch={{
                      optionFilterProp: "label",
                    }}
                    aria-label="目标语言"
                  />
                </Form.Item>
                <Tooltip title="按当前设置执行简繁转换">
                  <Button
                    block
                    icon={<SwapOutlined />}
                    onClick={() => (uploadMode === "single" ? handleConversion(sourceCNLanguage, targetCNLanguage, sourceText) : handleMultipleConversion(sourceCNLanguage, targetCNLanguage))}>
                    执行转换
                  </Button>
                </Tooltip>
                <Divider style={{ margin: "12px 0" }} />
                <Space orientation="vertical" size={0}>
                  <Tooltip title="自动合并断开的段落，优化排版">
                    <Checkbox checked={smartLineBreak} onChange={(e) => setSmartLineBreak(e.target.checked)}>
                      智能换行
                    </Checkbox>
                  </Tooltip>
                  <Tooltip title="每次只处理一个文件，上传新文件时自动替换">
                    <Checkbox checked={singleFileMode} onChange={(e) => setSingleFileMode(e.target.checked)}>
                      单文件模式
                    </Checkbox>
                  </Tooltip>
                  <Tooltip title="关闭预览以加快处理速度，适合处理大文件">
                    <Checkbox checked={largeMode} onChange={(e) => setLargeMode(e.target.checked)}>
                      大文件模式
                    </Checkbox>
                  </Tooltip>
                  {multipleFiles.length < 2 && (
                    <Tooltip title="转换完成后直接下载文件，跳过预览">
                      <Checkbox checked={directExport} onChange={(e) => setDirectExport(e.target.checked)}>
                        处理后自动导出
                      </Checkbox>
                    </Tooltip>
                  )}
                </Space>
              </Form>
            </Card>

            <Card title="快捷转换">
              <Space orientation="vertical" style={{ width: "100%" }}>
                <Tooltip title="一键将繁体文本转换为简体">
                  <Button
                    block
                    type="primary"
                    icon={<VerticalAlignBottomOutlined />}
                    onClick={() => (uploadMode === "single" ? handleConversion("t", "cn", sourceText) : handleMultipleConversion("tw", "cn"))}>
                    繁 ➔ 简
                  </Button>
                </Tooltip>
                <Tooltip title="一键将简体文本转换为繁体">
                  <Button
                    block
                    type="primary"
                    icon={<VerticalAlignTopOutlined />}
                    onClick={() => (uploadMode === "single" ? handleConversion("cn", "t", sourceText) : handleMultipleConversion("cn", "tw"))}>
                    简 ➔ 繁
                  </Button>
                </Tooltip>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Spin>
  );
};

export default ClientPage;
