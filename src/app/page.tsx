import type { Metadata } from "next";
import ClientPage from "./client";
import { generateChineseToolMetadata } from "@/app/lib/chineseSeo";

export async function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "zh-hant" }];
}
// autocorrect: false
export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale = "zh" } = await params;
  return generateChineseToolMetadata({
    locale,
    title: "简繁转换工具 - 本地离线处理，隐私安全批量转换 - Tools by AI",
    description: "还在担心简繁转换泄露隐私？本地简繁转换工具完全离线处理，支持简体中文↔台湾繁体↔香港繁体↔日本新字体互转，批量处理海量文本，操作简单结果精准，数据安全有保障！",
    keywords: "简繁转换, 简体转繁体, 繁体转简体, 繁体台湾, 繁体香港, 简繁转换工具, 在线中文转换, 批量转换简繁, 中文文本转换, 中文语言工具, OpenCC转换, 日本新字体转换, js-opencc",
    path: "chinese-conversion",
  });
}

export default function Page() {
  return <ClientPage />;
}
