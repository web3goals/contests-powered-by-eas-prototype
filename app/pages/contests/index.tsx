import AccountAvatar from "@/components/account/AccountAvatar";
import AccountLink from "@/components/account/AccountLink";
import EntityList from "@/components/entity/EntityList";
import Layout from "@/components/layout";
import { CardBox, FullWidthSkeleton } from "@/components/styled";
import { profileContractAbi } from "@/contracts/abi/profileContract";
import useError from "@/hooks/useError";
import useUriDataLoader from "@/hooks/useUriDataLoader";
import { Contest } from "@/types";
import { chainToSupportedChainConfig } from "@/utils/chains";
import { Typography, Link as MuiLink, Stack } from "@mui/material";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useContractRead, useNetwork } from "wagmi";

/**
 * Page to with contests.
 */
export default function Contests() {
  const { chain } = useNetwork();
  const { handleError } = useError();
  const [contests, setContests] = useState<Contest[] | undefined>();

  useEffect(() => {
    // Prepare query for EAS
    const schemaId = chainToSupportedChainConfig(chain).eas.contestSchemaUid;
    const query = `
        query Attestations {
          attestations(where: { schemaId: {equals: "${schemaId}"} }, orderBy: {timeCreated: desc}) {
            id
            timeCreated
            attester
            decodedDataJson
          }
        }
      `;
    // Send query to EAS
    axios
      .post(chainToSupportedChainConfig(chain).eas.graphQl as string, {
        query: query,
      })
      .then(({ data }) => {
        const contests: Contest[] = [];
        for (const attestation of data.data.attestations) {
          const attestationData = JSON.parse(attestation.decodedDataJson);
          contests.push({
            id: attestation.id,
            time: attestation.timeCreated,
            organizer: attestation.attester,
            title: attestationData[0].value.value,
            description: attestationData[1].value.value,
            judges: attestationData[2].value.value,
            participants: attestationData[3].value.value,
          });
        }
        setContests(contests);
      })
      .catch((error: any) => handleError(error, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout maxWidth="sm">
      {contests ? (
        <EntityList
          entities={contests}
          renderEntityCard={(contest, index) => (
            <ContestCard contest={contest} key={index} />
          )}
          noEntitiesText="😐 no contests"
        />
      ) : (
        <FullWidthSkeleton />
      )}
    </Layout>
  );
}

function ContestCard(props: { contest: Contest }) {
  const { chain } = useNetwork();

  /**
   * Define profile uri data
   */
  const { data: organizerProfileUri } = useContractRead({
    address: chainToSupportedChainConfig(chain).contracts.profile,
    abi: profileContractAbi,
    functionName: "getURI",
    args: [props.contest.organizer],
  });
  const { data: organizerProfileUriData } =
    useUriDataLoader(organizerProfileUri);

  return (
    <CardBox
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <Link href={`/contests/${props.contest.id}`} passHref legacyBehavior>
        <MuiLink fontWeight={700}>{props.contest.title}</MuiLink>
      </Link>
      <Typography mt={1}>{props.contest.description}</Typography>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={1}
        mt={2}
      >
        <Typography fontWeight={700} variant="body2">
          Organized by
        </Typography>
        <AccountAvatar
          size={28}
          emojiSize={12}
          account={props.contest.organizer}
          accountProfileUriData={organizerProfileUriData}
        />
        <AccountLink
          account={props.contest.organizer}
          accountProfileUriData={organizerProfileUriData}
        />
      </Stack>
      <Stack direction="row" spacing={2} mt={2}>
        <Typography variant="body2" color="text.secondary">
          <strong>{props.contest.participants.length}</strong> Participants
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>{props.contest.judges.length}</strong> Judges
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Started{" "}
          <strong>
            {new Date(props.contest.time * 1000).toLocaleString()}
          </strong>
        </Typography>
      </Stack>
    </CardBox>
  );
}
