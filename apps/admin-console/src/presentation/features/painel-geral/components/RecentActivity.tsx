import React, { useEffect, useMemo, useState } from "react";
import {
  REALTIME_CHANNELS,
  REALTIME_EVENT_TYPES,
  parseBridgeEvent,
  useRealtimeChannel,
} from "@grota/realtime-client";
import { getAllSellers, Seller } from "@/application/services/Seller/sellerService";
import { getRealtimeUrl } from "@/application/config/realtime";
import {
  Card,
  Typography,
  Avatar,
  Tag,
  Space,
  Badge,
  Tooltip
} from "antd";
import { ClockCircleOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface SellerActivity {
  id: string;
  sellerId: number;
  sellerName: string;
  action: string;
  target: string;
  status: "approval" | "submission" | "rejection" | "update";
  timestamp: string;
}

const typeConfig = {
  approval: {
    label: "Aprovação",
    color: "green",
  },
  submission: {
    label: "Envio",
    color: "blue",
  },
  rejection: {
    label: "Rejeição",
    color: "red",
  },
  update: {
    label: "Atualização",
    color: "orange",
  },
} as const;

const SALES_CHANNEL = REALTIME_CHANNELS.NOTIFICATIONS;
const SALES_IDENTITY = "admin-sellers-activity";

const formatTimeDistance = (value: string, now = Date.now()) => {
  const timestamp = new Date(value).getTime();
  const diff = Math.max(0, now - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    const seconds = Math.floor(diff / 1000);
    return `há ${seconds || 1}s`;
  }
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `há ${minutes}m`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `há ${hours}h`;
  }
  const days = Math.floor(diff / day);
  return `há ${days}d`;
};

const deriveInitials = (name: string) => {
  return name
    .split(" ")
    .map((piece) => piece.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export function RecentActivity() {
  const [activities, setActivities] = useState<SellerActivity[]>([]);
  const [sellersIndex, setSellersIndex] = useState<Record<number, Seller>>({});
  const [now, setNow] = useState(() => Date.now());

  const { messages } = useRealtimeChannel({
    channel: SALES_CHANNEL,
    identity: SALES_IDENTITY,
    url: getRealtimeUrl(),
  });

  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 10000); // 10s is enough for time display

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const syncSellers = async () => {
      try {
        const sellers = await getAllSellers();
        const map = sellers.reduce<Record<number, Seller>>((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});
        setSellersIndex(map);

        const bootstrapActivities: SellerActivity[] = sellers.map((seller) => ({
          id: `seller-${seller.id}`,
          sellerId: seller.id,
          sellerName: seller.fullName ?? `Vendedor ${seller.id}`,
          action: "está ativo",
          target: seller.email ?? seller.phone ?? "sem contato",
          status: "update",
          timestamp: seller.createdAt ?? new Date().toISOString(),
        }));
        setActivities(bootstrapActivities.slice(0, 10));
      } catch (error) {
        console.error("[RecentActivity] Failed to load sellers", error);
      }
    };

    syncSellers();
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    const parsed = parseBridgeEvent(lastMessage);
    if (
      //@ts-ignore
      parsed?.event !== REALTIME_EVENT_TYPES.SELLER_ACTIVITY_SENT ||
      //@ts-ignore
      !parsed.payload
    ) {
      return;
    }

    //@ts-ignore
    const payload = parsed.payload as SellerActivity;
    setActivities((current) => {
      const next = [payload, ...current];
      return next.slice(0, 20);
    });
  }, [lastMessage]);

  const displayedActivities = useMemo(() => {
    return activities.map((activity) => {
      const seller = sellersIndex[activity.sellerId];
      return {
        ...activity,
        sellerName: seller?.fullName ?? activity.sellerName,
        sellerInitials: seller?.fullName
          ? deriveInitials(seller.fullName)
          : deriveInitials(activity.sellerName),
      };
    });
  }, [activities, sellersIndex]);

  return (
    <Card 
      className="shadow-sm border-slate-200 h-full"
      title={
        <Space orientation="vertical" size={0}>
          <Typography.Title level={5} style={{ margin: 0 }}>Atividades Recentes</Typography.Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>Eventos em tempo real</Text>
        </Space>
      }
      extra={
        <Tag color="green" icon={<SyncOutlined spin />}>Live</Tag>
      }
    >
      <div style={{ height: '430px', overflowY: 'auto', paddingRight: '8px' }}>
        <div className="ant-list ant-list-horizontal">
          <div className="ant-spin-nested-loading">
            <div className="ant-spin-container">
              {displayedActivities.map((item) => (
                <div key={item.id} className="ant-list-item">
                  <div className="ant-list-item-meta">
                    <div className="ant-list-item-meta-avatar">
                      <Badge dot color={typeConfig[item.status]?.color || 'orange'} offset={[-2, 32]}>
                        <Avatar 
                          icon={<UserOutlined />} 
                          style={{ backgroundColor: '#134B73' }}
                        >
                          {item.sellerInitials}
                        </Avatar>
                      </Badge>
                    </div>
                    <div className="ant-list-item-meta-content">
                      <h4 className="ant-list-item-meta-title">
                        <Space size={4}>
                          <Text strong>{item.sellerName}</Text>
                          <Text type="secondary">{item.action}</Text>
                        </Space>
                      </h4>
                      <div className="ant-list-item-meta-description">
                        <Space orientation="vertical" size={0} style={{ width: '100%' }}>
                          <Tag color={typeConfig[item.status]?.color || 'orange'} style={{ fontSize: '10px', lineHeight: '16px' }}>
                            {typeConfig[item.status]?.label || 'Evento'}
                          </Tag>
                          <Text type="secondary" ellipsis style={{ fontSize: '11px', maxWidth: '200px' }}>
                            {item.target}
                          </Text>
                        </Space>
                      </div>
                    </div>
                  </div>
                  <ul className="ant-list-item-action" style={{ marginLeft: 48 }}>
                    <li>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <ClockCircleOutlined style={{ marginRight: '4px' }} />
                        {formatTimeDistance(item.timestamp, now)}
                      </Text>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
