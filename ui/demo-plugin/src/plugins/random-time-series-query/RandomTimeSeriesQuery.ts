// Copyright 2022 The Perses Authors
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

import { TimeSeriesQueryPlugin } from '@perses-dev/plugin-system';
import { parseTemplateVariables } from '../../model';
import { getTimeSeriesData } from './get-time-series-data';
import { PrometheusTimeSeriesQueryEditor } from './RandomTimeSeriesQueryEditor';
import { PrometheusTimeSeriesQuerySpec } from './time-series-query-model';

/**
 * The core Prometheus TimeSeriesQuery plugin for Perses.
 */
export const RandomTimeSeriesQuery: TimeSeriesQueryPlugin<PrometheusTimeSeriesQuerySpec> = {
  getTimeSeriesData,
  OptionsEditorComponent: PrometheusTimeSeriesQueryEditor,
  createInitialOptions: () => ({
    query: '',
    datasource: undefined,
  }),
  dependsOn: (spec) => {
    return {
      variables: parseTemplateVariables(spec.query),
    };
  },
};