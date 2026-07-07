{isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        selectedFeature ? (
          /* Feature-specific view */
          <div className="mt-4">
            <FeatureAnalyticsView
              featureKey={selectedFeature}
              companyRawData={
                filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && data.quarterlyCombinedRawData
                  ? data.quarterlyCombinedRawData
                  : data.companyRawData
              }
              currentInsights={
                filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && data.quarterlyCombinedInsights
                  ? data.quarterlyCombinedInsights
                  : data.currentInsights
              }
              currentAggregation={
                filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && data.quarterlyCombinedAggregation
                  ? data.quarterlyCombinedAggregation
                  : data.current
              }
              filters={{
                ...filters,
                ...(filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature)
                  ? { quarterlyKpiCombined: true }
                  : {}
                ),
              }}
              quarterlyPerQuarterRawData={
                (filters.period === 'annual' && (QUARTERLY_FEATURES.some(f => f.key === selectedFeature) || selectedFeature === 'csr'))
                  || (filters.period === 'quarterly' && selectedFeature === 'primarySecondaryPackaging')
                  ? data.quarterlyPerQuarterRawData
                  : undefined
              }
              allCompanyRawData={
                filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && data.allQuarterlyCombinedRawData
                  ? data.allQuarterlyCombinedRawData
                  : data.allCompanyRawData
              }
            />
          </div>
        ) : (
          /* Overview with tabs */
          <Tabs value={searchParams.get('tab') || 'insight' || "insightNew" || "trends"} onValueChange={(v) => { const sp = new URLSearchParams(searchParams); sp.set('tab', v); setSearchParams(sp, { replace: true }); }} className="mt-4">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="aggregation" className="flex items-center gap-1.5 text-xs">
                <BarChart3 className="w-3.5 h-3.5" />
                Aggregation
              </TabsTrigger>

              <TabsTrigger value="insight" className="flex items-center gap-1.5 text-xs">
                <Lightbulb className="w-3.5 h-3.5" />
                Insight
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-1.5 text-xs">
                <Lightbulb className="w-3.5 h-3.5" />
                Trends
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aggregation" className="mt-4">
              {/* Feature overview cards - click to select feature */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a feature from the dropdown above or click below to view detailed KPI analytics.
                </p>

                {/* In annual view, show quarterly + annual sections separately */}
                {filters.period === 'annual' && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Quarterly KPIs (Q1-Q4 Combined)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {QUARTERLY_FEATURES.map(feature => renderFeatureCard(feature, data, featureEnabledMap, handleSelectFeature, true))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Annual KPIs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ANNUAL_FEATURES.map(feature => renderFeatureCard(feature, data, featureEnabledMap, handleSelectFeature))}
                      </div>
                    </div>
                  </>
                )}

                {/* In quarterly view, show all features in one grid */}
                {filters.period === 'quarterly' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableFeatures.map(feature => renderFeatureCard(feature, data, featureEnabledMap, handleSelectFeature))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insight" className="mt-4">
              <InsightTab
                insights={
                  filters.period === 'annual' && data.quarterlyCombinedInsights
                    ? {
                      ...data.currentInsights,
                      // Composite scores depend on quarterly employment data — overlay them
                      deiCompositeScore: data.quarterlyCombinedInsights.deiCompositeScore,
                      socialScore: data.quarterlyCombinedInsights.socialScore,
                      esgCompositeScore: data.quarterlyCombinedInsights.esgCompositeScore,
                      supplyChainSustainabilityScore: data.quarterlyCombinedInsights.supplyChainSustainabilityScore,
                      circularEconomyIndex: data.quarterlyCombinedInsights.circularEconomyIndex,
                      governanceScore: data.quarterlyCombinedInsights.governanceScore,
                      // Employment-derived metrics
                      genderDiversityRatio: data.quarterlyCombinedInsights.genderDiversityRatio,
                      womenInLeadershipPct: data.quarterlyCombinedInsights.womenInLeadershipPct,
                      pwdInclusionRate: data.quarterlyCombinedInsights.pwdInclusionRate,
                      cxoPayRatio: data.quarterlyCombinedInsights.cxoPayRatio,
                      jobsPerCrRevenue: data.quarterlyCombinedInsights.jobsPerCrRevenue,
                      caseResolutionRate: data.quarterlyCombinedInsights.caseResolutionRate,
                      highImpactIncidentRatio: data.quarterlyCombinedInsights.highImpactIncidentRatio,
                      poshCaseIntensity: data.quarterlyCombinedInsights.poshCaseIntensity,
                      // CSR ratio needs annual spend + quarterly revenue
                      csrSpendRatio: (() => {
                        const annualCsrSpend = data.current?.csrSpendAmount ?? 0;
                        const qRevenue = data.quarterlyCombinedAggregation?.netRevenue ?? 0;
                        return qRevenue > 0 ? Math.round((annualCsrSpend / (qRevenue * 1e7)) * 100 * 10000) / 10000 : 0;
                      })(),
                    }
                    : data.currentInsights
                }
                timeSeries={data.timeSeries}
                companyRawData={
                  filters.period === 'annual' && data.quarterlyCombinedRawData
                    ? data.quarterlyCombinedRawData
                    : data.companyRawData
                }
                companyCount={data.companyCount}
                filters={filters}
                newInsight={false}
              />

            </TabsContent>

            <TabsContent value="trends" className="mt-4">
              {/* <TrendsComparisonPage /> */}
              <TrendsTab
                periodAFilters={{ period: 'quarterly', quarter: 'Q4', year: 2025, cumulative: false }}
                periodBFilters={{ period: 'quarterly', quarter: 'Q1', year: 2026, cumulative: false }}
                newInsight={true}
              />

              {/* <TrendsTab
                periodAFilters={{ period: 'annual', year: 2025, cumulative: false }}
                periodBFilters={{ period: 'quarterly', quarter: 'Q1', year: 2026, cumulative: false }}
                newInsight={true}
              /> */}
            </TabsContent>

          </Tabs>
        )
      ) : null}