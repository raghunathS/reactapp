import { useEffect, useMemo, useState, useRef } from 'react';
import {
  AppLayout,
  Box,
  Button,
  Container,
  Grid,
  Header,
  Input,
  SegmentedControl,
  Select,
  SelectProps,
  SpaceBetween,
  Toggle,
  Textarea,
  Modal,
  Flashbar,
  FlashbarProps,
} from '@cloudscape-design/components';
import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:8001' });
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, LabelList } from 'recharts';
import NavigationPanel from '../../components/navigation-panel';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import html2canvas from 'html2canvas';

interface MonthlyPoint { month: string; count: number }

interface Annotation {
  month: string;
  label: string;
  description?: string;
}

type Mode = 'rolling' | 'cumulative';

type BaselineSource = 'last_year_avg' | 'manual_avg' | 'manual_number';

const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TrendsPage() {
  const { selectedYear, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [csp, setCsp] = useState<SelectProps.Option>({ label: 'All', value: 'All' });

  const [mode, setMode] = useState<Mode>('rolling');
  const [windowSize, setWindowSize] = useState('3');

  const [baselineSource, setBaselineSource] = useState<BaselineSource>('last_year_avg');
  const [manualAvgMonths, setManualAvgMonths] = useState<SelectProps.Option[]>([]);
  const [manualNumber, setManualNumber] = useState('0');

  const [data, setData] = useState<MonthlyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI toggles
  const [showBaseline, setShowBaseline] = useState(true);
  const [showPercentage, setShowPercentage] = useState(false);
  const [smoothing, setSmoothing] = useState(false);
  const [showScore, setShowScore] = useState(false);

  // Annotations
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [newAnnotationMonth, setNewAnnotationMonth] = useState<SelectProps.Option>();
  const [newAnnotationLabel, setNewAnnotationLabel] = useState('');
  const [newAnnotationDescription, setNewAnnotationDescription] = useState('');
  const [flashMessages, setFlashMessages] = useState<FlashbarProps.MessageDefinition[]>([]);

  // Chart refs for export
  const trendChartRef = useRef<HTMLDivElement>(null);
  const deltaChartRef = useRef<HTMLDivElement>(null);

  // Fetch monthly counts for current year
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get<MonthlyPoint[]>('/api/tickets-monthly', {
          params: {
            year: selectedYear,
            csp: csp.value === 'All' ? undefined : csp.value,
            environment: selectedEnvironment,
            narrow_environment: selectedNarrowEnvironment,
          }
        });
        setData(resp.data);
      } catch (e: any) {
        setError('Failed to load monthly ticket counts');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, selectedEnvironment, selectedNarrowEnvironment, csp.value]);

  // Baseline value
  const baseline = useMemo(() => {
    const numeric = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const average = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0) / arr.length : 0;

    if (baselineSource === 'manual_number') {
      return numeric(manualNumber);
    }

    if (baselineSource === 'manual_avg') {
      if (!manualAvgMonths.length) return 0;
      const months = new Set(manualAvgMonths.map(m => m.value as string));
      const vals = data.filter(d => months.has(d.month)).map(d => d.count);
      return average(vals);
    }

    return NaN; // placeholder for last_year_avg computed below via hook
  }, [baselineSource, manualNumber, manualAvgMonths, data]);

  const [lastYearAvg, setLastYearAvg] = useState<number | null>(null);
  useEffect(() => {
    if (baselineSource !== 'last_year_avg') return;
    const fetchLastYear = async () => {
      try {
        const resp = await api.get<MonthlyPoint[]>('/api/tickets-monthly', {
          params: {
            year: selectedYear - 1,
            csp: csp.value === 'All' ? undefined : csp.value,
            environment: selectedEnvironment,
            narrow_environment: selectedNarrowEnvironment,
          }
        });
        const vals = resp.data.map(d => d.count);
        const avg = vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0;
        setLastYearAvg(avg);
      } catch {
        setLastYearAvg(0);
      }
    };
    fetchLastYear();
  }, [baselineSource, selectedYear, selectedEnvironment, selectedNarrowEnvironment, csp.value]);

  const resolvedBaseline = baselineSource === 'last_year_avg' ? (lastYearAvg ?? 0) : baseline;

  // Compute rolling/cumulative series
  const computedSeries = useMemo(() => {
    const arr = data.map(d => d.count);
    if (!arr.length) return [] as { month: string; actual: number; avg: number; delta: number; deltaPct: number; score: number }[];

    const series: { month: string; actual: number; avg: number; delta: number; deltaPct: number; score: number }[] = [];

    // Helper to compute score 1–5 based on delta vs baseline
    const computeScore = (delta: number, baseline: number) => {
      const pct = baseline !== 0 ? (delta / baseline) * 100 : 0;
      console.log('computeScore', { delta, baseline, pct });
      if (pct > 0) return 5;
      if (pct >= -10) return 4; // within 10% of baseline
      if (pct >= -20) return 3;
      if (pct >= -30) return 2;
      return 1; // 50%+ less
    };

    if (mode === 'rolling') {
      const w = Math.max(1, parseInt(windowSize || '1', 10));
      for (let i = 0; i < arr.length; i++) {
        const start = Math.max(0, i - w + 1);
        const slice = arr.slice(start, i + 1);
        const avg = slice.reduce((a,b)=>a+b,0) / slice.length;
        const month = data[i].month;
        const delta = avg - resolvedBaseline;
        const deltaPct = resolvedBaseline !== 0 ? ((avg - resolvedBaseline) / resolvedBaseline) * 100 : 0;
        const score = computeScore(delta, resolvedBaseline);
        console.log('rolling entry', { month, avg, resolvedBaseline, delta, deltaPct, score });
        series.push({ month, actual: arr[i], avg, delta, deltaPct, score });
      }
    } else {
      let sum = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
        const avg = sum / (i + 1);
        const month = data[i].month;
        const delta = avg - resolvedBaseline;
        const deltaPct = resolvedBaseline !== 0 ? ((avg - resolvedBaseline) / resolvedBaseline) * 100 : 0;
        const score = computeScore(delta, resolvedBaseline);
        console.log('cumulative entry', { month, avg, resolvedBaseline, delta, deltaPct, score });
        series.push({ month, actual: arr[i], avg, delta, deltaPct, score });
      }
    }

    return series;
  }, [data, mode, windowSize, resolvedBaseline]);

  const latest = computedSeries[computedSeries.length - 1];
  const ytdAvg = useMemo(() => computedSeries.length ? computedSeries[computedSeries.length - 1].avg : 0, [computedSeries]);

  const cspOptions: SelectProps.Option[] = [
    { label: 'All', value: 'All' },
    { label: 'AWS', value: 'AWS' },
    { label: 'GCP', value: 'GCP' },
  ];

  const monthOptions: SelectProps.Option[] = data.map((d, idx) => ({ value: d.month, label: `${monthLabels[idx]} (${d.month})` }));

  // Export utilities
  const exportCSV = () => {
    const rows = computedSeries.map(d => ({
      month: d.month,
      actual: d.actual,
      avg: d.avg,
      delta: d.delta,
      deltaPct: `${d.deltaPct.toFixed(2)}%`,
    }));
    const csv = [
      Object.keys(rows[0]).join(','),
      ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trends-${selectedYear}-${csp.value}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = async (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  // Annotation handlers
  const addAnnotation = () => {
    if (!newAnnotationMonth?.value || !newAnnotationLabel.trim()) return;
    const annotation: Annotation = {
      month: newAnnotationMonth.value,
      label: newAnnotationLabel.trim(),
      description: newAnnotationDescription.trim(),
    };
    setAnnotations([...annotations, annotation]);
    setNewAnnotationMonth(undefined);
    setNewAnnotationLabel('');
    setNewAnnotationDescription('');
    setShowAnnotationModal(false);
    setFlashMessages([{ type: 'success', content: 'Annotation added', dismissible: true, onDismiss: () => setFlashMessages([]) }]);
  };

  const removeAnnotation = (month: string) => {
    setAnnotations(annotations.filter(a => a.month !== month));
    setFlashMessages([{ type: 'info', content: 'Annotation removed', dismissible: true, onDismiss: () => setFlashMessages([]) }]);
  };

  // Custom tooltip to show annotation
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const annotation = annotations.find(a => a.month === label);
    return (
      <div style={{ background: '#fff', border: '1px solid #ccc', padding: 8 }}>
        <p>{`Month: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
          </p>
        ))}
        {annotation && (
          <div style={{ marginTop: 4, borderTop: '1px solid #eee', paddingTop: 4 }}>
            <strong>{annotation.label}</strong>
            {annotation.description && <p>{annotation.description}</p>}
          </div>
        )}
      </div>
    );
  };

  // Smoothed series for display
  const displaySeries = useMemo(() => {
    if (!smoothing) return computedSeries;
    const smoothed = [...computedSeries];
    for (let i = 1; i < smoothed.length - 1; i++) {
      smoothed[i] = {
        ...smoothed[i],
        avg: (smoothed[i - 1].avg + smoothed[i].avg + smoothed[i + 1].avg) / 3,
      };
    }
    return smoothed;
  }, [computedSeries, smoothing]);

  // Chart data for percentage mode
  const chartData = useMemo(() => {
    let base = displaySeries;
    if (showPercentage) {
      base = base.map(d => ({ ...d, avg: d.deltaPct, delta: d.deltaPct }));
    }
    if (showScore) {
      base = base.map(d => ({ ...d, score: d.score }));
    }
    return base;
  }, [displaySeries, showPercentage, showScore]);

  const deltaKey = showPercentage ? 'deltaPct' : showScore ? 'score' : 'delta';

  return (
    <AppLayout
      navigation={<NavigationPanel />}
      contentHeader={<Header variant="h1">Ticket Trends</Header>}
      content={
        <SpaceBetween size="l">
          <Container header={<Header variant="h2">Controls</Header>}>
            <Flashbar items={flashMessages} />
            <Grid gridDefinition={[{ colspan: 12 }, { colspan: 12 }]}>
              <SpaceBetween size="s">
                <Box variant="awsui-key-label">CSP</Box>
                <Select
                  selectedOption={csp}
                  onChange={({ detail }) => setCsp(detail.selectedOption)}
                  options={cspOptions}
                />
              </SpaceBetween>
              <SpaceBetween size="s">
                <Box variant="awsui-key-label">Averaging Mode</Box>
                <SegmentedControl
                  selectedId={mode}
                  onChange={({ detail }) => setMode(detail.selectedId as Mode)}
                  options={[{ id: 'rolling', text: 'Rolling' }, { id: 'cumulative', text: 'Cumulative' }]}
                />
                {mode === 'rolling' && (
                  <>
                    <Box variant="awsui-key-label">Window Size</Box>
                    <Input type="number" value={windowSize} onChange={({ detail }) => setWindowSize(detail.value)} />
                  </>
                )}
              </SpaceBetween>
            </Grid>

            <Grid gridDefinition={[{ colspan: 12 }, { colspan: 12 }]}>
              <SpaceBetween size="s">
                <Box variant="awsui-key-label">Baseline Source</Box>
                <Select
                  selectedOption={{ value: baselineSource, label: baselineSource === 'last_year_avg' ? 'Last Year Average' : baselineSource === 'manual_avg' ? 'Average of Selected Months' : 'Manual Number' }}
                  onChange={({ detail }) => setBaselineSource(detail.selectedOption?.value as BaselineSource)}
                  options={[
                    { value: 'last_year_avg', label: 'Last Year Average' },
                    { value: 'manual_avg', label: 'Average of Selected Months' },
                    { value: 'manual_number', label: 'Manual Number' },
                  ]}
                />
                {baselineSource === 'manual_avg' && (
                  <>
                    <Box variant="awsui-key-label">Select Months</Box>
                    <Select
                      selectedOptions={manualAvgMonths}
                      onChange={({ detail }) => setManualAvgMonths(detail.selectedOptions || [])}
                      options={monthOptions}
                      selectedAriaLabel="Selected months"
                      placeholder="Choose month(s)"
                      filteringType="auto"
                      multiple
                    />
                  </>
                )}
                {baselineSource === 'manual_number' && (
                  <>
                    <Box variant="awsui-key-label">Baseline Number</Box>
                    <Input type="number" value={manualNumber} onChange={({ detail }) => setManualNumber(detail.value)} />
                  </>
                )}
              </SpaceBetween>

              <SpaceBetween size="s">
                <Box variant="awsui-key-label">Display Options</Box>
                <Toggle
                  checked={showBaseline}
                  onChange={({ detail }) => setShowBaseline(detail.checked)}
                >
                  Show Baseline Line
                </Toggle>
                <Toggle
                  checked={showPercentage}
                  onChange={({ detail }) => setShowPercentage(detail.checked)}
                >
                  Show Percentage Delta
                </Toggle>
                <Toggle
                  checked={smoothing}
                  onChange={({ detail }) => setSmoothing(detail.checked)}
                >
                  Smoothing (3-point avg)
                </Toggle>
                <Toggle
                  checked={showScore}
                  onChange={({ detail }) => setShowScore(detail.checked)}
                >
                  Show Score (1–5)
                </Toggle>
              </SpaceBetween>
            </Grid>

            <Grid gridDefinition={[{ colspan: 12 }, { colspan: 12 }]}>
              <SpaceBetween size="s">
                <Box variant="awsui-key-label">Actions</Box>
                <SpaceBetween direction="horizontal" size="s">
                  <Button onClick={() => window.location.reload()}>Reset</Button>
                  <Button onClick={exportCSV}>Export CSV</Button>
                  <Button onClick={() => exportPNG(trendChartRef, `trend-${selectedYear}-${csp.value}.png`)}>Export Trend PNG</Button>
                  <Button onClick={() => exportPNG(deltaChartRef, `delta-${selectedYear}-${csp.value}.png`)}>Export Delta PNG</Button>
                  <Button onClick={() => setShowAnnotationModal(true)}>Add Annotation</Button>
                </SpaceBetween>
                <Box variant="awsui-key-label">Baseline Value</Box>
                <Box variant="h2">{Math.round((resolvedBaseline + Number.EPSILON) * 100) / 100}</Box>
              </SpaceBetween>

              <SpaceBetween size="s">
                <Box variant="awsui-key-label">Annotations</Box>
                {annotations.length === 0 ? (
                  <Box color="text-status-inactive">No annotations</Box>
                ) : (
                  <SpaceBetween size="xs">
                    {annotations.map(a => (
                      <Box key={a.month}>
                        <strong>{a.month}</strong>: {a.label}
                        <Button variant="inline-icon" iconName="close" onClick={() => removeAnnotation(a.month)} />
                      </Box>
                    ))}
                  </SpaceBetween>
                )}
              </SpaceBetween>
            </Grid>
          </Container>

          <Container header={<Header variant="h2">Monthly Trend</Header>}>
            {error && <Box color="text-status-danger">{error}</Box>}
            {loading ? (
              <Box>Loading...</Box>
            ) : (
              <div ref={trendChartRef}>
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={!showPercentage && !showScore} tickFormatter={showPercentage ? (v) => `${v}%` : showScore ? undefined : undefined} domain={showScore ? [0, 5] : undefined} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {showBaseline && <ReferenceLine y={showPercentage ? 0 : showScore ? undefined : resolvedBaseline} stroke="#8884d8" strokeDasharray="3 3" label={showPercentage ? '0%' : showScore ? undefined : 'Baseline'} />}
                    <Line type="monotone" dataKey="actual" name="Actual" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="avg" name={showPercentage ? 'Delta %' : showScore ? 'Score (1–5)' : (mode === 'rolling' ? 'Rolling Avg' : 'Cumulative Avg')} stroke="#8884d8" />
                    {showScore && <Line type="monotone" dataKey="score" name="Score (1–5)" stroke="#ff7300" strokeWidth={2} />}
                    {annotations.map(a => {
                      const point = chartData.find(d => d.month === a.month);
                      if (!point) return null;
                      return <ReferenceLine key={a.month} x={a.month} stroke="#ff7300" strokeDasharray="3 3" label={a.label} />;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Container>

          <Container header={<Header variant="h2">Delta vs Baseline</Header>}>
            <div ref={deltaChartRef}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={showPercentage ? (v) => `${v}%` : showScore ? undefined : undefined} domain={showScore ? [0, 5] : undefined} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={deltaKey} name={showPercentage ? 'Delta %' : showScore ? 'Score (1–5)' : 'Delta'} fill="#8884d8">
                    <LabelList dataKey={deltaKey} position="top" formatter={showPercentage ? (v: any) => `${v.toFixed(1)}%` : showScore ? (v: any) => v : undefined} />
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={showScore ? (entry.score >= 4 ? '#82ca9d' : entry.score === 3 ? '#ffc658' : '#ff7300') : (entry[deltaKey] >= 0 ? '#82ca9d' : '#ff7300')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Container>

          <Grid gridDefinition={[{ colspan: 8 }, { colspan: 8 }, { colspan: 8 }]}>
            <Container header={<Header variant="h3">Latest Month</Header>}>
              <SpaceBetween size="xs">
                <Box>Month: {latest?.month ?? '-'}</Box>
                <Box>Actual: {latest?.actual ?? '-'}</Box>
                <Box>Average: {latest?.avg?.toFixed(2) ?? '-'}</Box>
                <Box>Delta vs Baseline: {latest ? (latest.delta >= 0 ? '+' : '') + latest.delta.toFixed(2) : '-'}</Box>
                {showPercentage && <Box>Delta %: {latest ? (latest.deltaPct >= 0 ? '+' : '') + latest.deltaPct.toFixed(2) + '%' : '-'}</Box>}
                {showScore && <Box>Score (1–5): {latest?.score ?? '-'}</Box>}
              </SpaceBetween>
            </Container>
            <Container header={<Header variant="h3">YTD Average</Header>}>
              <SpaceBetween size="xs">
                <Box>Average: {ytdAvg.toFixed(2)}</Box>
                <Box>Delta vs Baseline: {(ytdAvg - resolvedBaseline).toFixed(2)}</Box>
                {showPercentage && <Box>Delta %: {resolvedBaseline !== 0 ? ((ytdAvg - resolvedBaseline) / resolvedBaseline * 100).toFixed(2) + '%' : '-'}</Box>}
              </SpaceBetween>
            </Container>
            <Container header={<Header variant="h3">Context</Header>}>
              <SpaceBetween size="xs">
                <Box>Year: {selectedYear}</Box>
                <Box>Environment: {selectedEnvironment}</Box>
                <Box>Narrow Env: {selectedNarrowEnvironment}</Box>
                <Box>CSP: {csp.value}</Box>
              </SpaceBetween>
            </Container>
          </Grid>
        </SpaceBetween>
      }
      tools={[
        showAnnotationModal && (
          <Modal
            key="annotation-modal"
            visible={showAnnotationModal}
            header="Add Annotation"
            onDismiss={() => setShowAnnotationModal(false)}
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="s">
                  <Button variant="link" onClick={() => setShowAnnotationModal(false)}>Cancel</Button>
                  <Button variant="primary" onClick={addAnnotation}>Add</Button>
                </SpaceBetween>
              </Box>
            }
          >
            <SpaceBetween size="s">
              <Box variant="awsui-key-label">Month</Box>
              <Select
                selectedOption={newAnnotationMonth}
                onChange={({ detail }) => setNewAnnotationMonth(detail.selectedOption)}
                options={monthOptions}
                placeholder="Select month"
              />
              <Box variant="awsui-key-label">Label</Box>
              <Input value={newAnnotationLabel} onChange={({ detail }) => setNewAnnotationLabel(detail.value)} placeholder="Short label" />
              <Box variant="awsui-key-label">Description (optional)</Box>
              <Textarea value={newAnnotationDescription} onChange={({ detail }) => setNewAnnotationDescription(detail.value)} placeholder="Details" />
            </SpaceBetween>
          </Modal>
        )
      ]}
    />
  );
}
