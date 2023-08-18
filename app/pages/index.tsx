import Layout from "@/components/layout";
import { ExtraLargeLoadingButton } from "@/components/styled";
import { Box, Container, Typography } from "@mui/material";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
import { useAccount } from "wagmi";

/**
 * Landing page.
 */
export default function Landing() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <Layout maxWidth={false} disableGutters hideToolbar sx={{ p: 0 }}>
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: { xs: "column-reverse", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          py: 6,
        }}
      >
        {/* Left part */}
        <Box sx={{ textAlign: { xs: "center", md: "start" }, mr: { md: 0 } }}>
          <Typography variant="h1" mt={1}>
            <strong>Organize contests</strong> valuable for everyone, not just
            the winners
          </Typography>
          {address ? (
            <Link href={`/contests/start`}>
              <ExtraLargeLoadingButton variant="contained" sx={{ mt: 4 }}>
                Let’s go!
              </ExtraLargeLoadingButton>
            </Link>
          ) : (
            <ExtraLargeLoadingButton
              variant="contained"
              sx={{ mt: 4 }}
              onClick={() => openConnectModal?.()}
            >
              Let’s go!
            </ExtraLargeLoadingButton>
          )}
        </Box>
        {/* Right part */}
        <Box width={{ xs: "100%", md: "100%", lg: "100%" }}>
          <Image
            src="/images/happiness.png"
            alt="Happiness"
            width="100"
            height="100"
            sizes="100vw"
            style={{
              width: "100%",
              height: "auto",
            }}
          />
        </Box>
      </Container>
    </Layout>
  );
}
