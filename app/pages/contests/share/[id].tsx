import Layout from "@/components/layout";
import { useRouter } from "next/router";

/**
 * Page to share a contest
 */
export default function ContestShare() {
  const router = useRouter();
  const { id } = router.query;

  return <Layout maxWidth="sm">...</Layout>;
}
