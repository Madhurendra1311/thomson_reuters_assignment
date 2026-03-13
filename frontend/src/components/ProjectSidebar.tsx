import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import type { Milestone, Project, WeeklyReport } from '../types'

export function ProjectSidebar(props: {
  projects: Project[]
  selectedProjectId: number | null
  onChangeProjectId: (projectId: number) => void
  milestones: Milestone[]
  lastReport: WeeklyReport | null
}) {
  const handleChange = (e: SelectChangeEvent<string>) => {
    const id = Number(e.target.value)
    if (!Number.isFinite(id) || id <= 0) return
    props.onChangeProjectId(id)
  }

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <FormControl fullWidth size="small">
            <InputLabel id="project-select-label">Project</InputLabel>
            <Select
              labelId="project-select-label"
              value={props.selectedProjectId ? String(props.selectedProjectId) : ''}
              label="Project"
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>Select a project…</em>
              </MenuItem>
              {props.projects.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Memory recap
          </Typography>

          {props.selectedProjectId ? (
            <Stack spacing={1.25}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Milestones
                </Typography>
                {props.milestones.length ? (
                  <Box component="ul" sx={{ pl: 2, my: 0.5 }}>
                    {props.milestones.map((m) => (
                      <li key={m.id}>
                        <Typography variant="body2">
                          {m.title}
                          {m.status ? ` (${m.status})` : ''}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No milestones recorded.
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Last week&apos;s report
                </Typography>
                {props.lastReport ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      border: '1px dashed',
                      borderColor: 'divider',
                      maxHeight: 160,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {(props.lastReport.final_text || props.lastReport.draft_text).slice(
                      0,
                      400,
                    )}
                    …
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No prior report stored.
                  </Typography>
                )}
              </Box>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select a project to see milestones and memory.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}

