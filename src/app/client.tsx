"use client";

import React from "react";
import { Typography } from "antd";
import { QuestionCircleOutlined, ProfileOutlined } from "@ant-design/icons";
import { useZhText } from "@/app/hooks/zh/useZhText";
import Function from "./function";

const { Title, Paragraph, Link } = Typography;

const ClientPage = () => {
  const z = useZhText();
  return (
    <>
      <Title level={1} style={{ fontSize: "1.6em", fontWeight: 600, marginTop: 0 }}>
        <ProfileOutlined /> {z("简繁转换工具")}
      </Title>
      <Paragraph type="secondary" ellipsis={{ rows: 3, expandable: true, symbol: "more" }}>
        <Link href="https://docs.newzone.top/guide/others/chinese-conversion.html" target="_blank" rel="noopener noreferrer">
          <QuestionCircleOutlined /> {z("使用说明")}
        </Link>{" "}
        {z("无需上传文本至第三方，所有转换均在本地完成，确保隐私安全。支持简体中文、台湾繁体、香港繁体及日本新字体互转，适合批量处理海量文本。操作简单，只需点击「繁转简」或「简转繁」按钮即可；进阶用户亦可自定义源语言和目标语言，实现指定字体间的转换。")}
        {z("例如：简体中文 → 繁体（台湾）且转换词汇，自行車 → 腳踏車。如遇问题或有建议，欢迎通过社群或反馈页面与我们交流。")}
      </Paragraph>
      <Function />
    </>
  );
};

export default ClientPage;
