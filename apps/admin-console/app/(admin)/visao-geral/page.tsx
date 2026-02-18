"use client";

import { useEffect, useState } from "react";
import { 
  ConversionFunnel, 
  FinancingChart, 
  ManagersList, 
  OperatorsList, 
  QuickStats, 
  SellersList,
  StatusDistribution
} from "@/presentation/features/painel-geral";
import { Skeleton, Row, Col, ConfigProvider, theme } from "antd";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 8,
          colorPrimary: '#134B73',
        },
      }}
    >
      <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <QuickStats />

          <Row gutter={[24, 24]}>
            <Col xs={24} xl={24}>
              <FinancingChart />
            </Col>

          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={24}>
              <ConversionFunnel />
            </Col>
          </Row>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <ManagersList />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <OperatorsList />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <SellersList />
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-4">
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: '200px' }} />
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map(i => (
              <Col xs={24} sm={12} xl={6} key={i}>
                <Skeleton.Button active block style={{ height: 120 }} />
              </Col>
            ))}
          </Row>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} xl={16}>
            <Skeleton.Button active block style={{ height: 400 }} />
          </Col>
          <Col xs={24} xl={8}>
            <Skeleton.Button active block style={{ height: 400 }} />
          </Col>
        </Row>
        <Skeleton active />
      </div>
    </div>
  );
}
