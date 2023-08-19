import AccountAvatar from "@/components/account/AccountAvatar";
import AccountLink from "@/components/account/AccountLink";
import EntityList from "@/components/entity/EntityList";
import Layout from "@/components/layout";
import {
  CardBox,
  ExtraLargeLoadingButton,
  FullWidthSkeleton,
} from "@/components/styled";
import { useProvider } from "@/hooks/easWagmiUtils";
import useError from "@/hooks/useError";
import { theme } from "@/theme";
import { Contest, PageMetaData } from "@/types";
import { chainToSupportedChainConfig } from "@/utils/chains";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import {
  Avatar,
  Box,
  Stack,
  SxProps,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import axios from "axios";
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
    <Layout maxWidth="sm">
      {contest ? (
        <>
          {/* Title and description */}
          <Typography variant="h4" fontWeight={700} textAlign="center">
            🏆 {contest.title}
          </Typography>
          <Typography textAlign="center" mt={1}>
            {contest.description}
          </Typography>
          {/* Organizers and judges */}
          <Typography textAlign="center" fontWeight={700} mt={3}>
            Organized by
          </Typography>
          <ContestAccount account={contest.organizer} sx={{ mt: 1 }} />
          <Typography textAlign="center" fontWeight={700} mt={3}>
            Judged by
          </Typography>
          <Stack spacing={1} mt={1}>
            {contest.judges.map((judge, index) => (
              <ContestAccount key={index} account={judge} />
            ))}
          </Stack>
          <Box display="flex" justifyContent="center" mt={3}>
            <Link href={`/contests/share/${id}`} passHref legacyBehavior>
              <ExtraLargeLoadingButton variant="outlined">
                Share
              </ExtraLargeLoadingButton>
            </Link>
          </Box>
          <ContestParticipants contest={contest} sx={{ mt: 3 }} />
        </>
      ) : (
        <FullWidthSkeleton />
      )}
    </Layout>
  );
}

function ContestAccount(props: { account: `0x${string}`; sx?: SxProps }) {
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

// TODO: Load all evaluations for this hackathon
function ContestParticipants(props: { contest: Contest; sx?: SxProps }) {
  return (
    <EntityList
      entities={props.contest.participants}
      renderEntityCard={(participant, index) => (
        <ContestParticipant
          key={index}
          participant={participant}
          judges={props.contest.judges}
          evaluations={[]}
        />
      )}
      noEntitiesText="😐 no participants"
      sx={{ ...props.sx }}
    />
  );
}

// TODO: Check if connected account is judge, and check if connected account is already evaluated project or not
function ContestParticipant(props: {
  participant: string;
  judges: string[];
  evaluations: any[];
}) {
  const { handleError } = useError();
  const [participantMetaData, setParticipantMetaData] = useState<
    PageMetaData | undefined
  >();

  useEffect(() => {
    axios
      .get(`/api/getPageMetaData?url=${props.participant}`)
      .then(({ data }) => setParticipantMetaData(data.data))
      .catch((error: any) => handleError(error, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.participant]);

  if (participantMetaData) {
    return (
      <CardBox sx={{ display: "flex", flexDirection: "row" }}>
        {/* Left part */}
        <Box>
          <Avatar
            sx={{
              width: 82,
              height: 82,
              borderRadius: 3,
              background: theme.palette.divider,
            }}
            src={participantMetaData.image}
          >
            <Typography fontSize={24}>⭐</Typography>
          </Avatar>
        </Box>
        {/* Right part */}
        <Box width={1} ml={2} display="flex" flexDirection="column">
          <MuiLink href={props.participant} target="_blank" fontWeight={700}>
            {participantMetaData.title}
          </MuiLink>
          <Typography variant="body2">
            {participantMetaData.description?.substring(0, 128)}...
          </Typography>
        </Box>
      </CardBox>
    );
  }

  return <FullWidthSkeleton />;
}
