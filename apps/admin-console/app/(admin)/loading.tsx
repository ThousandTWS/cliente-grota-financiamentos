import React from "react";
import { Skeleton, Row, Col } from "antd";

/**
 * Next.js 15+ Loading UI Convention
 * Este componente será exibido automaticamente enquanto as rotas do grupo (admin) carregam.
 */
export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Banner Skeleton */}
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
          <Skeleton.Button active block style={{ height: 200 }} />
        </div>

        {/* QuickStats Skeleton */}
        <div className="space-y-4">
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: "200px" }} />
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((i) => (
              <Col xs={24} sm={12} xl={6} key={i}>
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                  <Skeleton active avatar paragraph={{ rows: 1 }} />
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Main Content Skeleton */}
        <Row gutter={[24, 24]}>
          <Col xs={24} xl={24}>
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <Skeleton active paragraph={{ rows: 10 }} />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
