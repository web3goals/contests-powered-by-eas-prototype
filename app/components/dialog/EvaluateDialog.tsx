import { useSigner } from "@/hooks/easWagmiUtils";
import useError from "@/hooks/useError";
import useToasts from "@/hooks/useToast";
import { chainToSupportedChainConfig } from "@/utils/chains";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import {
  Checkbox,
  Dialog,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
} from "@mui/material";
import { Form, Formik } from "formik";
import { useState } from "react";
import { zeroAddress } from "viem";
import { useNetwork } from "wagmi";
import * as yup from "yup";
import FormikHelper from "../helper/FormikHelper";
import { DialogCenterContent, ExtraLargeLoadingButton } from "../styled";

export default function EvaluateDialog(props: {
  contest: string;
  participant: string;
  isClose?: boolean;
  onClose?: () => void;
  onEvaluate?: () => void;
}) {
  const { chain } = useNetwork();
  const { handleError } = useError();
  const { showToastSuccess } = useToasts();
  const signer = useSigner();

  /**
   * Form states
   */
  const [formValues, setFormValues] = useState({
    tags: [],
    comment: "",
  });

  const formValidationSchema = yup.object({
    comment: yup.string().required(),
  });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  /**
   * Dialog states
   */
  const [isOpen, setIsOpen] = useState(!props.isClose);

  /**
   * Function to close dialog
   */
  async function close() {
    setIsOpen(false);
    props.onClose?.();
  }

  async function submit(values: any) {
    try {
      setIsFormSubmitting(true);
      // Check signer
      if (!signer) {
        throw new Error("You need to connect your wallet");
      }
      // Calculate points
      let points = 0;
      for (const tag of values.tags) {
        points += Number((tag as string).split("_").pop());
      }
      // Init EAS
      const EASContractAddress = chainToSupportedChainConfig(chain).eas
        .contract as `0x${string}`;
      const eas = new EAS(EASContractAddress);
      eas.connect(signer);
      // Prepare data
      const schemaEncoder = new SchemaEncoder(
        "bytes32 contest,string project,string[] tags,uint8 points,string comment"
      );
      const encodedData = schemaEncoder.encodeData([
        {
          name: "contest",
          value: props.contest,
          type: "bytes32",
        },
        {
          name: "project",
          value: props.participant,
          type: "string",
        },
        {
          name: "tags",
          value: values.tags,
          type: "string[]",
        },
        {
          name: "points",
          value: points,
          type: "uint8",
        },
        {
          name: "comment",
          value: values.comment,
          type: "string",
        },
      ]);
      // Send transaction
      const tx = await eas.attest({
        schema: chainToSupportedChainConfig(chain).eas.evaluationSchemaUid,
        data: {
          recipient: zeroAddress,
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData,
        },
      });
      await tx.wait();
      // Show success message
      showToastSuccess("Participant is evaluated");
      props.onEvaluate?.();
      close();
    } catch (error: any) {
      handleError(error, true);
      setIsFormSubmitting(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={!isFormSubmitting ? close : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogCenterContent>
        <Typography variant="h4" fontWeight={700} textAlign="center">
          👀 Evaluate the participant
        </Typography>
        <Typography textAlign="center" mt={1}>
          Try to post more detailed comments, it will help the developer become
          better
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
              {/* Tags */}
              <FormGroup sx={{ mt: 2 }}>
                <FormControlLabel
                  control={<Checkbox />}
                  label="🦄 Presentation (+5 points)"
                  name="tags"
                  value="PRESENTATION_5"
                  onChange={handleChange}
                  disabled={isFormSubmitting}
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="🚀 Potential Impact (+5 points)"
                  name="tags"
                  value="POTENTIAL_IMPACT_5"
                  onChange={handleChange}
                  disabled={isFormSubmitting}
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="💡 Creativity (+5 points)"
                  name="tags"
                  value="CREATIVITY_5"
                  onChange={handleChange}
                  disabled={isFormSubmitting}
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="🤯 Difficulty (+5 points)"
                  name="tags"
                  value="DIFFICULTY_5"
                  onChange={handleChange}
                  disabled={isFormSubmitting}
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="✨ Open Source (+3 points)"
                  name="tags"
                  value="OPEN_SOURCE_3"
                  onChange={handleChange}
                  disabled={isFormSubmitting}
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="📄 Documentation (+3 points)"
                  name="tags"
                  value="DOCUMENTATION_3"
                  onChange={handleChange}
                  disabled={isFormSubmitting}
                />
              </FormGroup>
              {/* Comment */}
              <TextField
                fullWidth
                id="comment"
                name="comment"
                label="Comment"
                placeholder="Pros and cons..."
                multiline={true}
                minRows={3}
                value={values.comment}
                onChange={handleChange}
                error={touched.comment && Boolean(errors.comment)}
                helperText={<>{touched.comment && errors.comment}</>}
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
      </DialogCenterContent>
    </Dialog>
  );
}
