import {
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import type { WeeklyReport } from '../types'

export function ReportEditor(props: {
  report: WeeklyReport | null
  value: string
  onChange: (v: string) => void
  onFinalize: () => void
  isSubmitting: boolean
}) {
  return (
    <Stack spacing={1.5} sx={{ height: '100%' }}>
      <Typography variant="h6">Weekly Report</Typography>
      <Paper variant="outlined" sx={{ p: 1.5, flex: 1, display: 'flex' }}>
        <TextField
          multiline
          fullWidth
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder="Generated report will appear here after you type “generate”."
          minRows={14}
        />
      </Paper>
      <Button
        variant="contained"
        color="secondary"
        onClick={props.onFinalize}
        disabled={!props.report || props.isSubmitting}
        endIcon={<SaveRoundedIcon />}
      >
        Finalize &amp; Save
      </Button>
    </Stack>
  )
}

