"use client";

import React from "react";
import { ProfileOutlined } from "@ant-design/icons";
import { useTranslations, useLocale } from "next-intl";
import { getDocUrl } from "@/app/utils";
import ToolPage from "@/app/components/styled/ToolPage";
import ChineseConversion from "./ChineseConversion";

const ClientPage = () => {
  const t = useTranslations("ChineseConversion");
  const locale = useLocale();
  const userGuideUrl = getDocUrl("guide/text/chinese-conversion.html", locale);

  return (
    <ToolPage showExportFolder icon={<ProfileOutlined />} toolKey="chineseConversion" description={`${t("description1")} ${t("description2")}`} guideUrl={userGuideUrl}>
      <ChineseConversion />
    </ToolPage>
  );
};

export default ClientPage;
