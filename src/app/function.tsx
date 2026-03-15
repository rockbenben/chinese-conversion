"use client";

import React, { useState } from "react";
import { Button, Input, Typography, Select, Form, App, Upload, Tooltip, Card, Space, Spin, Row, Col, Divider, Collapse, Switch, Flex } from "antd";
import { SwapOutlined, InboxOutlined, ClearOutlined, TranslationOutlined, ControlOutlined } from "@ant-design/icons";
import { cleanLines, downloadFile, punctuationEndRegex, specialLineStartRegex, pureNumberRegex, getFileTypePresetConfig } from "@/app/utils";
import { useTextStats } from "@/app/hooks/useTextStats";
import { useCopyToClipboard } from "@/app/hooks/zh/useCopyToClipboard";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import useFileUpload from "@/app/hooks/useFileUpload";
import { createConverter } from "js-opencc";
import ZhResultCard from "@/app/components/zh/ZhResultCard";

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
  const [result, setResult] = useState("");

  const sourceStats = useTextStats(sourceText);

  const [phraseConversion, setPhraseConversion] = useLocalStorage("chineseConversion_phraseConversion", false);
  const [directExport, setDirectExport] = useLocalStorage("chineseConversion_directExport", false);
  const [smartLineBreak, setSmartLineBreak] = useLocalStorage("chineseConversion_smartLineBreak", false);

  // 自定义语言（高级选项）
  const [customFrom, setCustomFrom] = useLocalStorage("chineseConversion_customFrom", "cn");
  const [customTo, setCustomTo] = useLocalStorage("chineseConversion_customTo", "twp");

  // Collapse 展开状态
  const [collapseActiveKeys, setCollapseActiveKeys] = useLocalStorage<string[]>("chineseConversion_collapseKeys", []);

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
      message.error("请输入或粘贴待转换文本");
      return;
    }
    const converter = await createConverter({ from: from as "cn" | "tw" | "twp" | "hk" | "t" | "jp", to: to as "cn" | "tw" | "twp" | "hk" | "t" | "jp" });
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
    if (multipleFiles.length === 0) {
      message.error("请先上传待处理文件");
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

    message.success("处理完成，文件已自动下载", 10);
  };

  // 自定义语言转换
  const handleCustomConversion = () => {
    if (customFrom === customTo) {
      message.warning("源语言和目标语言不能相同");
      return;
    }
    if (uploadMode === "single") {
      handleConversion(customFrom, customTo, sourceText);
    } else {
      handleMultipleConversion(customFrom, customTo);
    }
  };

  return (
    <Spin spinning={isFileProcessing} description="请稍候..." size="large">
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
              accept={uploadFileTypes.accept}
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
              <p className="ant-upload-hint">支持的格式：{uploadFileTypes.formatLabel({ maxVisible: 8, separator: " " })}</p>
            </Dragger>
            {uploadMode === "single" && (
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
              <Flex justify="end" className="mt-2">
                <Typography.Text type="secondary" className="!text-xs">
                  {sourceStats.charCount} 字符 / {sourceStats.lineCount} 行
                </Typography.Text>
              </Flex>
            )}
          </Card>

          {result && (
            <ZhResultCard
              value={result}
              onChange={setResult}
              onCopy={() => copyToClipboard(result)}
              onExport={() => {
                const fileName = handleExportFile(result);
                message.success(`文件已导出：${fileName}`);
              }}
              className="!mt-3"
            />
          )}
        </Col>

        <Col xs={24} md={6}>
          <Card title="转换设置">
            <Space orientation="vertical" size="middle" className="w-full">
              {/* 词汇转换开关 */}
              <Tooltip title="同时转换台湾地区惯用词汇（如：视频↔影片、幼儿园↔幼稚園）">
                <Space>
                  <Switch checked={phraseConversion} onChange={setPhraseConversion} size="small" />
                  <span>转换地区词汇</span>
                </Space>
              </Tooltip>

              {/* 简繁转换按钮 */}
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Button
                    block
                    type="primary"
                    size="large"
                    onClick={() => {
                      const from = phraseConversion ? "twp" : "t";
                      if (uploadMode === "single") {
                        handleConversion(from, "cn", sourceText);
                      } else {
                        handleMultipleConversion(from, "cn");
                      }
                    }}>
                    繁➔简
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    type="primary"
                    size="large"
                    onClick={() => {
                      const to = phraseConversion ? "twp" : "t";
                      if (uploadMode === "single") {
                        handleConversion("cn", to, sourceText);
                      } else {
                        handleMultipleConversion("cn", to);
                      }
                    }}>
                    简➔繁
                  </Button>
                </Col>
              </Row>

              <Divider className="!my-0" />

              {/* 高级选项 */}
              <Collapse
                ghost
                size="small"
                activeKey={collapseActiveKeys}
                onChange={(keys) => setCollapseActiveKeys(keys as string[])}
                items={[
                  {
                    key: "options",
                    label: (
                      <Space>
                        <ControlOutlined />
                        <Typography.Text strong>高级设置</Typography.Text>
                      </Space>
                    ),
                    children: (
                      <Flex vertical gap="small">
                        <Flex justify="space-between" align="center">
                          <Tooltip title="自动合并断开的段落，优化排版">
                            <span>智能换行</span>
                          </Tooltip>
                          <Switch size="small" checked={smartLineBreak} onChange={setSmartLineBreak} aria-label="智能换行" />
                        </Flex>
                        <Flex justify="space-between" align="center">
                          <Tooltip title="每次只处理一个文件，上传新文件时自动替换">
                            <span>单文件模式</span>
                          </Tooltip>
                          <Switch size="small" checked={singleFileMode} onChange={setSingleFileMode} aria-label="单文件模式" />
                        </Flex>

                        {multipleFiles.length < 2 && (
                          <Flex justify="space-between" align="center">
                            <Tooltip title="转换完成后直接下载文件，跳过预览">
                              <span>处理后自动导出</span>
                            </Tooltip>
                            <Switch size="small" checked={directExport} onChange={setDirectExport} aria-label="处理后自动导出" />
                          </Flex>
                        )}
                      </Flex>
                    ),
                  },
                  {
                    key: "custom",
                    label: (
                      <Space>
                        <TranslationOutlined />
                        <Typography.Text strong>自定义语言</Typography.Text>
                      </Space>
                    ),
                    children: (
                      <Form layout="vertical" size="small">
                        <Form.Item label="源语言" className="!mb-2">
                          <Select value={customFrom} onChange={setCustomFrom} options={cnLanguages} className="w-full" aria-label="自定义源语言" />
                        </Form.Item>
                        <Form.Item label="目标语言" className="!mb-2">
                          <Select value={customTo} onChange={setCustomTo} options={cnLanguages} className="w-full" aria-label="自定义目标语言" />
                        </Form.Item>
                        <Button block onClick={handleCustomConversion} icon={<SwapOutlined />}>
                          自定义转换
                        </Button>
                      </Form>
                    ),
                  },
                ]}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

export default ClientPage;
