import AccountAvatar from "@/components/account/AccountAvatar";
import AccountLink from "@/components/account/AccountLink";
import Layout from "@/components/layout";
import {
  ExtraLargeLoadingButton,
  FullWidthSkeleton,
} from "@/components/styled";
import { useProvider } from "@/hooks/easWagmiUtils";
import useError from "@/hooks/useError";
import { Contest } from "@/types";
import { chainToSupportedChainConfig } from "@/utils/chains";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { Box, Stack, SxProps, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { decodeAbiParameters, parseAbiParameters } from "viem";
import { useNetwork } from "wagmi";

/**
 * Page with a contest.
 */
export default function Contest() {
  const router = useRouter();
  const { id } = router.query;
  const { handleError } = useError();
  const { chain } = useNetwork();
  const provider = useProvider();
  const [contest, setContest] = useState<Contest | undefined>();

  /**
   * Load contest
   */
  useEffect(() => {
    setContest(undefined);
    if (id && provider) {
      // Init EAS
      const EASContractAddress = chainToSupportedChainConfig(chain).eas
        .contract as `0x${string}`;
      const eas = new EAS(EASContractAddress);
      eas.connect(provider);
      // Get contest
      eas
        .getAttestation(id as string)
        .then((attestation) => {
          const decodedData = decodeAbiParameters(
            parseAbiParameters(
              "string title,string description,address[] judges,string[] participants"
            ),
            attestation.data as `0x${string}`
          );
          setContest({
            organizer: attestation.attester as `0x${string}`,
            title: decodedData[0],
            description: decodedData[1],
            judges: decodedData[2] as `0x${string}`[],
            participants: decodedData[3] as string[],
          });
        })
        .catch((error: any) => handleError(error, true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, provider]);

  return (
    <Layout maxWidth="md">
      {contest ? (
        <>
          <Typography variant="h4" fontWeight={700} textAlign="center">
            🏆 {contest.title}
          </Typography>
          <Typography textAlign="center" mt={1}>
            {contest.description}
          </Typography>
          <Typography textAlign="center" fontWeight={700} mt={3}>
            Organized by
          </Typography>
          <ContestMember account={contest.organizer} sx={{ mt: 1 }} />
          <Typography textAlign="center" fontWeight={700} mt={3}>
            Judged by
          </Typography>
          <Stack spacing={1} mt={1}>
            {contest.judges.map((judge, index) => (
              <ContestMember key={index} account={judge} />
            ))}
          </Stack>
          <Box display="flex" justifyContent="center" mt={3}>
            <Link href={`/contests/share/${id}`} passHref legacyBehavior>
              <ExtraLargeLoadingButton variant="outlined">
                Share
              </ExtraLargeLoadingButton>
            </Link>
          </Box>
        </>
      ) : (
        <FullWidthSkeleton />
      )}
    </Layout>
  );
}

function ContestMember(props: { account: `0x${string}`; sx?: SxProps }) {
  /**
   * Define account profile uri data
   */
  // TODO: Implement
  const accountProfileUriData = undefined;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{ ...props.sx }}
    >
      <AccountAvatar
        size={24}
        emojiSize={12}
        account={props.account}
        accountProfileUriData={accountProfileUriData}
      />
      <AccountLink
        account={props.account}
        accountProfileUriData={accountProfileUriData}
        variant="body1"
      />
    </Stack>
  );
}
