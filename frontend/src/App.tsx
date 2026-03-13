import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Toolbar,
  Typography,
  createTheme,
  ThemeProvider,
} from '@mui/material'

import { ProjectSidebar } from './components/ProjectSidebar'
import { ChatPanel } from './components/ChatPanel'
import { ReportEditor } from './components/ReportEditor'
import type { ChatMessage, Milestone, Project, WeeklyReport } from './types'

type Step =
  | 'chooseProject'
  | 'enterAccomplishments'
  | 'enterPlans'
  | 'enterRisks'
  | 'confirm'
  | 'generated'
  | 'finalized'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#60a5fa' },
    secondary: { main: '#f472b6' },
    background: { default: '#0b1220', paper: '#0f172a' },
  },
  shape: { borderRadius: 12 },
})

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [lastReport, setLastReport] = useState<WeeklyReport | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [step, setStep] = useState<Step>('chooseProject')
  const [userName, setUserName] = useState('')

  const [accomplishments, setAccomplishments] = useState('')
  const [plans, setPlans] = useState('')
  const [risks, setRisks] = useState('')

  const [generatedReport, setGeneratedReport] = useState<WeeklyReport | null>(null)
  const [reportText, setReportText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const api = useMemo(
    () =>
      axios.create({
        baseURL: 'http://localhost:8000',
      }),
    [],
  )

  useEffect(() => {
    const bootstrap = async () => {
      const res = await api.get<Project[]>('/projects')
      setProjects(res.data)
      setChatMessages([
        {
          id: 1,
          sender: 'bot',
          text: 'Hi! Which project do you want to update today?',
        },
      ])
    }
    bootstrap().catch(console.error)
  }, [api])

  useEffect(() => {
    if (selectedProjectId == null) return
    const loadContext = async () => {
      const project = projects.find((p) => p.id === selectedProjectId)
      const reportRes = await api.get<WeeklyReport[]>('/reports', {
        params: { project_id: selectedProjectId },
      })
      const last = reportRes.data[reportRes.data.length - 1] ?? null
      setLastReport(last)

      const projectMilestones =
        projects.find((p) => p.id === selectedProjectId)?.milestones ?? []
      setMilestones(projectMilestones as Milestone[])

      if (project) {
        const recapLines = [
          `Here are current milestones I know for "${project.name}":`,
          ...projectMilestones.map((m: Milestone) => {
            return `- ${m.title}${m.status ? ` (${m.status})` : ''}`
          }),
          last ? `Last week's report exists for week starting ${last.week_start}.` : '',
        ].filter(Boolean)

        setChatMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            sender: 'bot',
            text: recapLines.join('\n'),
          },
          {
            id: prev.length + 2,
            sender: 'bot',
            text: 'First, what is your name?',
          },
        ])
      }
    }
    loadContext().catch(console.error)
  }, [api, projects, selectedProjectId])

  const weekStartIso = useMemo(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = (day + 6) % 7
    const monday = new Date(today)
    monday.setDate(today.getDate() - diff)
    return monday.toISOString().slice(0, 10)
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    const text = input.trim()
    setChatMessages((prev) => [
      ...prev,
      { id: prev.length + 1, sender: 'user', text },
    ])
    setInput('')

    if (step === 'chooseProject') {
      const project = projects.find(
        (p) => p.name.toLowerCase() === text.toLowerCase(),
      )
      if (!project) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            sender: 'bot',
            text: 'Please type the exact project name from the dropdown on the side.',
          },
        ])
        return
      }
      setSelectedProjectId(project.id)
    } else if (step === 'enterAccomplishments') {
      setAccomplishments(text)
      setStep('enterPlans')
      setChatMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'bot',
          text: 'What are the main plans for next week?',
        },
      ])
    } else if (step === 'enterPlans') {
      setPlans(text)
      setStep('enterRisks')
      setChatMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'bot',
          text: 'Any risks or issues to call out?',
        },
      ])
    } else if (step === 'enterRisks') {
      setRisks(text)
      setStep('confirm')
      setChatMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'bot',
          text:
            'Got it. Type "generate" when you are ready and I will create a weekly report.',
        },
      ])
    } else if (step === 'confirm') {
      if (text.toLowerCase().includes('generate')) {
        await submitUpdateAndGenerate()
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            sender: 'bot',
            text: 'When you are ready, type "generate" to create the report.',
          },
        ])
      }
    } else if (step === 'generated') {
      setReportText(text)
    }
  }

  const submitUpdateAndGenerate = async () => {
    if (!selectedProjectId) return
    setIsSubmitting(true)
    try {
      if (!userName) {
        setUserName('Guest')
      }
      await api.post('/updates', {
        project_id: selectedProjectId,
        user_name: userName || 'Guest',
        week_start: weekStartIso,
        accomplishments,
        plans_next_week: plans,
        risks_issues: risks,
      })
      const res = await api.post<{ report: WeeklyReport }>(
        '/reports/generate',
        {
          project_id: selectedProjectId,
          week_start: weekStartIso,
        },
      )
      setGeneratedReport(res.data.report)
      setReportText(res.data.report.draft_text)
      setStep('generated')
      setChatMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'bot',
          text:
            'Here is a draft weekly report. You can edit it on the right and click "Finalize & Save" when done.',
        },
      ])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalize = async () => {
    if (!generatedReport) return
    setIsSubmitting(true)
    try {
      const res = await api.post<WeeklyReport>('/reports/finalize', {
        report_id: generatedReport.id,
        final_text: reportText,
      })
      setGeneratedReport(res.data)
      setStep('finalized')
      setChatMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'bot',
          text:
            'Great, your report is finalized and will be used as "last week" for the next run.',
        },
      ])
    } finally {
      setIsSubmitting(false)
    }
  }

  const onChangeProjectId = (id: number) => {
    setSelectedProjectId(id)
    setStep('enterAccomplishments')
    setChatMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: 'bot',
        text:
          'Great choice. To start, what were the main accomplishments for this week?',
      },
    ])
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Project Update Chat Reporter
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Capture weekly updates → generate report → finalize
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            alignItems: 'stretch',
            gridTemplateColumns: { xs: '1fr', md: '320px 1.2fr 1fr' },
          }}
        >
          <Box>
            <ProjectSidebar
              projects={projects}
              selectedProjectId={selectedProjectId}
              onChangeProjectId={onChangeProjectId}
              milestones={milestones}
              lastReport={lastReport}
            />
          </Box>

          <Box sx={{ height: { xs: 'auto', md: 520 } }}>
            <ChatPanel
              messages={chatMessages}
              input={input}
              setInput={setInput}
              onSend={() => void handleSend()}
              isSubmitting={isSubmitting}
            />
          </Box>

          <Box sx={{ height: { xs: 'auto', md: 520 } }}>
            <ReportEditor
              report={generatedReport}
              value={reportText}
              onChange={setReportText}
              onFinalize={() => void handleFinalize()}
              isSubmitting={isSubmitting}
            />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App
