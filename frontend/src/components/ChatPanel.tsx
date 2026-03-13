import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import type { ChatMessage } from '../types'

export function ChatPanel(props: {
  messages: ChatMessage[]
  input: string
  setInput: (v: string) => void
  onSend: () => void
  isSubmitting: boolean
}) {
  return (
    <Stack spacing={1.5} sx={{ height: '100%' }}>
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          p: 2,
          overflow: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={1}>
          {props.messages.map((m) => (
            <Box
              key={m.id}
              sx={{
                display: 'flex',
                justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                sx={{
                  maxWidth: '92%',
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor:
                    m.sender === 'user' ? 'success.light' : 'action.hover',
                  color:
                    m.sender === 'user' ? 'success.contrastText' : 'text.primary',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.text.split('\n').map((line, idx) => (
                  <Typography key={idx} variant="body2">
                    {line}
                  </Typography>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          fullWidth
          size="small"
          placeholder="Type your message…"
          value={props.input}
          onChange={(e) => props.setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') props.onSend()
          }}
        />
        <Button
          variant="contained"
          onClick={props.onSend}
          disabled={props.isSubmitting}
          endIcon={
            props.isSubmitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SendRoundedIcon />
            )
          }
        >
          Send
        </Button>
      </Stack>
    </Stack>
  )
}

