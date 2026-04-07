"use client";

import { useEffect, useState } from "react";
import {
  ConversionFunnel,
  FinancingChart,
  ManagersList,
  OperatorsList,
  QuickStats,
  SellersList,
} from "@/presentation/features/painel-geral";
import { BannerCarousel } from "@/presentation/components/Dashboard/BannerCarousel";
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
          <BannerCarousel
            height={300}
            slides={[
              {
                id: 1,
                backgroundImageUrl: "https://res.cloudinary.com/dao3brh15/image/upload/q_auto/f_auto/v1775532982/pros-e-contras-carro-novo-ou-usado_vixbbg.jpg",
                tag: "Crédito Automotivo",
                title: "Financiamento Rápido e Seguro",
              },
              {
                id: 2,
                backgroundImageUrl: "https://res.cloudinary.com/dao3brh15/image/upload/q_auto/f_auto/v1775533288/antecipacao-de-recebiveis_vnshtz.jpg",
                tag: "Parceria Financeira",
                title: "Bancos Parceiros",
              },
              {
                id: 3,
                backgroundImageUrl: "https://res.cloudinary.com/dao3brh15/image/upload/q_auto/f_auto/v1775533627/como-pagar-boleto-online_stnrtc.jpg",
                tag: "Experiência e Confiança",
                title: "+30 Anos no Mercado",
              },
            ]}
          />
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
