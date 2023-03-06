import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
} from '@mui/material';
import { useQueryClient, Query, QueryCache, QueryKey } from '@tanstack/react-query';
import { TimeSeriesQueryDefinition, UnknownSpec } from '@perses-dev/core';
import { TIME_SERIES_QUERY_KEY, useTimeRange } from '../runtime';
import { TimeSeriesData } from '../model';

export interface WarningEvent {
  query: string;
  summary: string;
}

interface QueryInspectorProps {
  showTotalQueries?: boolean;
}

export function QueryInspector(props: QueryInspectorProps) {
  const { showTotalQueries } = props;
  const queryClient = useQueryClient();
  const queries = queryClient.getQueryCache().findAll();
  const activeQueries = queries.filter((query) => query.state.status === 'loading');
  const completedQueries = queries.filter((query) => query.state.status === 'success');

  const { absoluteTimeRange } = useTimeRange();

  const querySummary = useCurrentTimeSeriesQueries();

  const warningEvents: WarningEvent[] = [];
  querySummary.forEach((query) => {
    const queryData = query.state.data;
    if (queryData && queryData.warnings) {
      const queryKey = query.queryKey as [TimeSeriesQueryDefinition<UnknownSpec>];
      warningEvents.push({
        query: String(queryKey[0].spec.plugin.spec.query),
        summary: getResponseHeadersSummary(queryData.warnings),
      });
    }
  });

  return (
    <Stack spacing={2} mb={2}>
      <Box>
        <Typography variant="h2" mb={1}>
          Query Summary
        </Typography>
        <TableContainer component={Paper}>
          <Table
            sx={{
              maxWidth: 800,
            }}
            size="small"
            aria-label="query inspector table"
          >
            <TableHead>
              <TableRow>
                <TableCell>Active Queries</TableCell>
                <TableCell>Time Series Queries</TableCell>
                {showTotalQueries && <TableCell>Total Queries</TableCell>}
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{activeQueries.length}</TableCell>
                <TableCell>{querySummary.length}</TableCell>
                {showTotalQueries && <TableCell>{completedQueries.length}</TableCell>}
                <TableCell>{absoluteTimeRange.start.toString()}</TableCell>
                <TableCell>{absoluteTimeRange.end.toString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {warningEvents.length > 0 && (
        <Box>
          <Typography variant="h3" mb={1}>
            Warnings
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table
              sx={{
                maxWidth: 800,
              }}
              size="small"
              aria-label="query warnings table"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Query</TableCell>
                  <TableCell>Warning</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warningEvents.map((details, idx) => {
                  return (
                    <TableRow key={idx}>
                      <TableCell>{details.query}</TableCell>
                      <TableCell>{details.summary}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Stack>
  );
}

export function getTimeSeriesQuerySummary(cache: QueryCache) {
  const queries = cache
    .findAll({ type: 'active' })
    .filter((query) => {
      const firstPart = query.queryKey?.[0] as UnknownSpec;
      if (firstPart?.kind) {
        return (firstPart?.kind as string).startsWith(TIME_SERIES_QUERY_KEY);
      }
      return false;
    })
    .filter((query) => query.isActive)
    .map((query) => {
      return query as Query<TimeSeriesData, unknown, TimeSeriesData, QueryKey>;
    });
  return queries;
}

/**
 * Get response headers for query inspection summary
 */
export function getResponseHeadersSummary(response: string | string[]): string {
  if (!response) {
    return '';
  }
  if (typeof response === 'string') {
    return response;
  }
  if (response.length) {
    return response[0] ?? '';
  }
  return '';
}

/**
 * Show info about running time series queries for results summary
 */
export function useCurrentTimeSeriesQueries() {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryCache();
  const timeSeriesQueries = getTimeSeriesQuerySummary(queryCache);
  return timeSeriesQueries;
}
