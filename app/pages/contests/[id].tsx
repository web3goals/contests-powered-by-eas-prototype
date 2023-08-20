import AccountAvatar from "@/components/account/AccountAvatar";
import AccountLink from "@/components/account/AccountLink";
import EvaluateDialog from "@/components/dialog/EvaluateDialog";
import EntityList from "@/components/entity/EntityList";
import Layout from "@/components/layout";
import {
  CardBox,
  FullWidthSkeleton,
  LargeLoadingButton,
  MediumLoadingButton,
  ThickDivider,
} from "@/components/styled";
import { EVALUATIONS } from "@/constants/evaluations";
import { DialogContext } from "@/context/dialog";
import { profileContractAbi } from "@/contracts/abi/profileContract";
import { useProvider } from "@/hooks/easWagmiUtils";
import useError from "@/hooks/useError";
import useUriDataLoader from "@/hooks/useUriDataLoader";
import { theme } from "@/theme";
import { Contest, Evaluation, PageMetaData } from "@/types";
import { chainToSupportedChainConfig } from "@/utils/chains";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import {
  Avatar,
  Box,
  Chip,
  Link as MuiLink,
  Stack,
  SxProps,
  Typography,
} from "@mui/material";
import axios from "axios";
import { chain } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { decodeAbiParameters, parseAbiParameters } from "viem";
import { useAccount, useContractRead, useNetwork } from "wagmi";

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
            id: attestation.uid as `0x${string}`,
            time: Number(attestation.time),
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
          <ContestOrganizerOfJudge
            organizerOfJudge={contest.organizer}
            sx={{ mt: 1 }}
          />
          <Typography textAlign="center" fontWeight={700} mt={3}>
            Judged by
          </Typography>
          <Stack spacing={1} mt={1}>
            {contest.judges.map((judge, index) => (
              <ContestOrganizerOfJudge key={index} organizerOfJudge={judge} />
            ))}
          </Stack>
          <Box display="flex" justifyContent="center" mt={3}>
            <Link href={`/contests/share/${id}`} passHref legacyBehavior>
              <LargeLoadingButton variant="outlined">Share</LargeLoadingButton>
            </Link>
          </Box>
          <ContestParticipants
            id={id as string}
            contest={contest}
            sx={{ mt: 3 }}
          />
        </>
      ) : (
        <FullWidthSkeleton />
      )}
    </Layout>
  );
}

function ContestOrganizerOfJudge(props: {
  organizerOfJudge: `0x${string}`;
  sx?: SxProps;
}) {
  const { chain } = useNetwork();

  /**
   * Define profile uri data
   */
  const { data: organizerOrJudge } = useContractRead({
    address: chainToSupportedChainConfig(chain).contracts.profile,
    abi: profileContractAbi,
    functionName: "getURI",
    args: [props.organizerOfJudge],
  });
  const { data: organizerOrJudgeProfileUriData } =
    useUriDataLoader(organizerOrJudge);

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{ ...props.sx }}
    >
      <AccountAvatar
        size={28}
        emojiSize={12}
        account={props.organizerOfJudge}
        accountProfileUriData={organizerOrJudgeProfileUriData}
      />
      <AccountLink
        account={props.organizerOfJudge}
        accountProfileUriData={organizerOrJudgeProfileUriData}
        variant="body1"
      />
    </Stack>
  );
}

function ContestParticipants(props: {
  id: string;
  contest: Contest;
  sx?: SxProps;
}) {
  return (
    <EntityList
      entities={props.contest.participants}
      renderEntityCard={(participant, index) => (
        <ContestParticipant
          key={index}
          id={props.id}
          participant={participant}
          judges={props.contest.judges}
        />
      )}
      noEntitiesText="😐 no participants"
      sx={{ ...props.sx }}
    />
  );
}

function ContestParticipant(props: {
  id: string;
  participant: string;
  judges: string[];
}) {
  const { showDialog, closeDialog } = useContext(DialogContext);
  const { chain } = useNetwork();
  const { handleError } = useError();
  const { address } = useAccount();
  const [participantMetaData, setParticipantMetaData] = useState<
    PageMetaData | undefined
  >();
  const [participantEvaluations, setParticipantEvaluations] = useState<
    Evaluation[] | undefined
  >();
  const [participantPoints, setParticipantPoints] = useState<
    number | undefined
  >();
  const [isParticipantEvaluated, setIsParticipantEvaluated] = useState<
    boolean | undefined
  >();

  async function loadEvaluations() {
    try {
      setParticipantEvaluations(undefined);
      setParticipantPoints(undefined);
      setIsParticipantEvaluated(undefined);
      // Prepare query for EAS
      const schemaId =
        chainToSupportedChainConfig(chain).eas.evaluationSchemaUid;
      const query = `
        query Attestations {
          attestations(where: { schemaId: {equals: "${schemaId}"}, decodedDataJson: {contains: "${props.participant}"} }, orderBy: {timeCreated: desc}) {
            id
            attester
            timeCreated
            decodedDataJson
          }
        }
      `;
      // Send query to EAS
      const { data } = await axios.post(
        chainToSupportedChainConfig(chain).eas.graphQl as string,
        { query: query }
      );
      // Parse response data and define states
      const evaluations: Evaluation[] = [];
      let points = 0;
      let isEvaluated = false;
      for (const attestation of data.data.attestations) {
        const attestationData = JSON.parse(attestation.decodedDataJson);
        const evaluation: Evaluation = {
          judge: attestation.attester,
          time: attestation.timeCreated,
          contest: attestationData[0].value.value,
          participant: attestationData[1].value.value,
          tags: attestationData[2].value.value,
          points: attestationData[3].value.value,
          comment: attestationData[4].value.value,
        };
        if (evaluation.contest !== props.id) {
          continue;
        }
        evaluations.push(evaluation);
        points += evaluation.points;
        if (evaluation.judge === address) {
          isEvaluated = true;
        }
      }
      // Update states
      setParticipantEvaluations(evaluations);
      setParticipantPoints(points);
      setIsParticipantEvaluated(isEvaluated);
    } catch (error: any) {
      handleError(error, true);
    }
  }

  useEffect(() => {
    axios
      .get(`/api/getPageMetaData?url=${props.participant}`)
      .then(({ data }) => setParticipantMetaData(data.data))
      .catch((error: any) => handleError(error, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.participant]);

  useEffect(() => {
    loadEvaluations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.participant, address]);

  if (participantMetaData && participantEvaluations) {
    return (
      <CardBox
        sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start" }}
      >
        {/* Left part */}
        <Box sx={{ background: theme.palette.divider, borderRadius: 3 }}>
          {/* Avatar */}
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
          {/* Points */}
          {participantPoints !== undefined && (
            <Stack alignItems="center" py={1}>
              <Typography fontWeight={700}>{participantPoints}</Typography>
              <Typography variant="body2">Points</Typography>
            </Stack>
          )}
        </Box>
        {/* Right part */}
        <Box
          width={1}
          ml={3}
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
        >
          {/* Title and description */}
          <MuiLink href={props.participant} target="_blank" fontWeight={700}>
            {participantMetaData.title}
          </MuiLink>
          <Typography variant="body2">
            {participantMetaData.description?.substring(0, 128)}...
          </Typography>
          {/* Evaluate button */}
          {address &&
            props.judges.includes(address) &&
            isParticipantEvaluated === false && (
              <MediumLoadingButton
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() =>
                  showDialog?.(
                    <EvaluateDialog
                      contest={props.id}
                      participant={props.participant}
                      onEvaluate={() => loadEvaluations()}
                      onClose={closeDialog}
                    />
                  )
                }
              >
                👀 Evaluate
              </MediumLoadingButton>
            )}
          {participantEvaluations.length > 0 && <ThickDivider sx={{ mt: 3 }} />}
          {/* Evaluations */}
          <Stack spacing={3} mt={3}>
            {participantEvaluations.map((evaluation, index) => (
              <ContestParticipantEvaluation
                key={index}
                evaluation={evaluation}
              />
            ))}
          </Stack>
        </Box>
      </CardBox>
    );
  }

  return <FullWidthSkeleton />;
}

function ContestParticipantEvaluation(props: { evaluation: Evaluation }) {
  const { chain } = useNetwork();

  /**
   * Define profile uri data
   */
  const { data: judgeProfileUri } = useContractRead({
    address: chainToSupportedChainConfig(chain).contracts.profile,
    abi: profileContractAbi,
    functionName: "getURI",
    args: [props.evaluation.judge],
  });
  const { data: judgeProfileUriData } = useUriDataLoader(judgeProfileUri);

  return (
    <Box sx={{ display: "flex", flexDirection: "row" }}>
      {/* Left part */}
      <Box>
        <AccountAvatar
          size={42}
          emojiSize={18}
          account={props.evaluation.judge}
          accountProfileUriData={judgeProfileUriData}
        />
      </Box>
      {/* Right part */}
      <Box
        width={1}
        ml={1.5}
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
      >
        <AccountLink
          account={props.evaluation.judge}
          accountProfileUriData={judgeProfileUriData}
        />
        <Typography variant="body2" color="text.secondary">
          {new Date(props.evaluation.time * 1000).toLocaleString()}
        </Typography>
        {props.evaluation.comment && (
          <Typography variant="body2" mt={1}>
            {props.evaluation.comment}
          </Typography>
        )}
        {props.evaluation.tags.map((tag, index) => (
          <Chip key={index} label={EVALUATIONS[tag]} sx={{ mt: 1 }} />
        ))}
      </Box>
    </Box>
  );
}
