import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { load } from "cheerio";
import { PageMetaData } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const pageUrl = req.query.url as string;
    const { data: pageSource } = await axios.get(pageUrl);
    const page = load(pageSource);
    const pageMetaData: PageMetaData = {
      url: pageUrl,
      title: page(`meta[property="og:title"]`).attr("content"),
      description: page(`meta[property="og:description"]`).attr("content"),
      image: page(`meta[property="og:image"]`).attr("content"),
    };
    res.status(200).json({ data: pageMetaData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: JSON.stringify(error) });
  }
}
