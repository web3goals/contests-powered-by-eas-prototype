import { Box, SxProps, Typography } from "@mui/material";
import { Container } from "@mui/system";

/**
 * Component with a footer.
 */
export default function Footer(props: { sx?: SxProps }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#000000",
        ...props.sx,
      }}
    >
      <Copyright />
    </Box>
  );
}

function Copyright(props: { sx?: SxProps }) {
  return (
    <Container maxWidth="md" sx={{ my: 6, ...props.sx }}>
      <Typography
        color="primary.contrastText"
        fontWeight={700}
        textAlign="center"
      >
        Contests powered by EAS © 2023
      </Typography>
      <Typography
        color="primary.contrastText"
        variant="body2"
        textAlign="center"
        mt={0.5}
      >
        Organize contests valuable for everyone, not just the winners
      </Typography>
    </Container>
  );
}
