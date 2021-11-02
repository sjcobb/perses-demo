// Copyright 2021 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  JsonObject,
  UseChartQueryHook,
  ChartQueryDefinition,
  DurationString,
  useDashboardSpec,
} from '@perses-ui/core';
import { useMemo } from 'react';
import { RangeQueryRequestParameters } from '../model/api-types';
import { createDataFrames } from '../model/data-frames';
import { useRangeQuery } from '../model/prometheus-client';
import { TemplateString, useReplaceTemplateString } from '../model/templating';
import {
  getDurationStringSeconds,
  useDashboardPrometheusTimeRange,
  usePanelRangeStep,
} from '../model/time';

export const PrometheusRangeChartQueryKind = 'PrometheusRangeChartQuery';

type PrometheusRangeChartQuery = ChartQueryDefinition<
  RangeChartQueryKind,
  RangeChartQueryOptions
>;

type RangeChartQueryKind = typeof PrometheusRangeChartQueryKind;

interface RangeChartQueryOptions extends JsonObject {
  query: TemplateString;
  min_step?: DurationString;
  resolution?: number;
}

export function usePrometheusRangeChartQuery(
  definition: PrometheusRangeChartQuery
): ReturnType<UseChartQueryHook<RangeChartQueryKind, RangeChartQueryOptions>> {
  const spec = useDashboardSpec();
  const dataSource = definition.datasource ?? spec.datasource;

  const minStep = getDurationStringSeconds(definition.options.min_step);
  const timeRange = useDashboardPrometheusTimeRange();
  const step = usePanelRangeStep(timeRange, minStep);

  const { result: query, needsVariableValuesFor } = useReplaceTemplateString(
    definition.options.query
  );

  const request: RangeQueryRequestParameters = {
    query,
    ...timeRange,
    step,
  };

  const {
    data: response,
    isLoading: loading,
    error,
  } = useRangeQuery(dataSource, request, {
    enabled: needsVariableValuesFor.size === 0,
  });

  const data = useMemo(() => createDataFrames(response), [response]);
  return { data, loading, error: error ?? undefined };
}
