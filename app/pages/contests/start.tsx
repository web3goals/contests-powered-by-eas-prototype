import FormikHelper from "@/components/helper/FormikHelper";
import Layout from "@/components/layout";
import { ExtraLargeLoadingButton } from "@/components/styled";
import { useSigner } from "@/hooks/easWagmiUtils";
import useError from "@/hooks/useError";
import useToasts from "@/hooks/useToast";
import { chainToSupportedChainConfig } from "@/utils/chains";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { TextField, Typography } from "@mui/material";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";
import { zeroAddress } from "viem";
import { useNetwork } from "wagmi";
import * as yup from "yup";

/**
 * Page to start a contest.
 */
export default function ContestStart() {
  const { chain } = useNetwork();
  const { handleError } = useError();
  const { showToastSuccess } = useToasts();
  const router = useRouter();
  const signer = useSigner();

  /**
   * Form states
   */
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    judges: "",
    participants: "",
  });

  const formValidationSchema = yup.object({
    title: yup.string().required(),
    description: yup.string().required(),
    judges: yup.string().required(),
    participants: yup.string().required(),
  });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  async function submit(values: any) {
    try {
      setIsFormSubmitting(true);
      if (!signer) {
        throw new Error("You need to connect your wallet");
      }
      // Init EAS
      const EASContractAddress = chainToSupportedChainConfig(chain).eas
        .contract as `0x${string}`;
      const eas = new EAS(EASContractAddress);
      eas.connect(signer);
      // Prepare data
      const schemaEncoder = new SchemaEncoder(
        "string title,string description,address[] judges,string[] participants"
      );
      const encodedData = schemaEncoder.encodeData([
        { name: "title", value: values.title, type: "string" },
        { name: "description", value: values.description, type: "string" },
        { name: "judges", value: values.judges.split("\n"), type: "address[]" },
        {
          name: "participants",
          value: values.participants.split("\n"),
          type: "string[]",
        },
      ]);
      // Send transaction
      const tx = await eas.attest({
        schema: chainToSupportedChainConfig(chain).eas.contestSchemaUid,
        data: {
          recipient: zeroAddress,
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData,
        },
      });
      const id = await tx.wait();
      // Show success message
      showToastSuccess("Contest is started");
      router.push(`/contests/share/${id}`);
    } catch (error: any) {
      handleError(error, true);
      setIsFormSubmitting(false);
    }
  }

  return (
    <Layout maxWidth="xs">
      <Typography variant="h4" fontWeight={700} textAlign="center">
        🚀 Start a contest
      </Typography>
      <Typography textAlign="center" mt={1}>
        valuable for everyone, not just the winners
      </Typography>
      <Formik
        initialValues={formValues}
        validationSchema={formValidationSchema}
        onSubmit={submit}
      >
        {({ values, errors, touched, handleChange, setValues }) => (
          <Form
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <FormikHelper onChange={(values: any) => setFormValues(values)} />
            {/* Title */}
            <TextField
              fullWidth
              id="title"
              name="title"
              label="Title"
              placeholder="ETHToronto Virtual Hackathon"
              multiline={true}
              minRows={1}
              value={values.title}
              onChange={handleChange}
              error={touched.title && Boolean(errors.title)}
              helperText={<>{touched.title && errors.title}</>}
              disabled={isFormSubmitting}
              sx={{ mt: 2 }}
            />
            {/* Description */}
            <TextField
              fullWidth
              id="description"
              name="description"
              label="Description"
              placeholder="Welcome to the 2nd Annual ETHToronto is an event you don't want to miss!"
              multiline={true}
              minRows={3}
              value={values.description}
              onChange={handleChange}
              error={touched.description && Boolean(errors.description)}
              helperText={<>{touched.description && errors.description}</>}
              disabled={isFormSubmitting}
              sx={{ mt: 2 }}
            />
            {/* Judges */}
            <TextField
              fullWidth
              id="judges"
              name="judges"
              label="Judges"
              placeholder="0x4306D7a79265D2cb85Db0c5a55ea5F4f6F73C4B1"
              multiline={true}
              minRows={3}
              value={values.judges}
              onChange={handleChange}
              error={touched.judges && Boolean(errors.judges)}
              helperText={<>{touched.judges && errors.judges}</>}
              disabled={isFormSubmitting}
              sx={{ mt: 2 }}
            />
            {/* Participants */}
            <TextField
              fullWidth
              id="participants"
              name="participants"
              label="Participants"
              placeholder="https://dorahacks.io/buidl/6934"
              multiline={true}
              minRows={3}
              value={values.participants}
              onChange={handleChange}
              error={touched.participants && Boolean(errors.participants)}
              helperText={<>{touched.participants && errors.participants}</>}
              disabled={isFormSubmitting}
              sx={{ mt: 2 }}
            />
            {/* Submit button */}
            <ExtraLargeLoadingButton
              loading={isFormSubmitting}
              variant="contained"
              type="submit"
              disabled={isFormSubmitting}
              sx={{ mt: 4 }}
            >
              Submit
            </ExtraLargeLoadingButton>
          </Form>
        )}
      </Formik>
    </Layout>
  );
}
