"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Tag,
  Divider,
  Skeleton,
  message,
  Space,
  AutoComplete,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  IdcardOutlined,
} from "@ant-design/icons";

const COMMON_ROLES = [
  { value: "Administrador" },
  { value: "Gerente de Vendas" },
  { value: "Operador de Financiamento" },
  { value: "Analista de Crédito" },
  { value: "Consultor de Vendas" },
  { value: "Diretor Operacional" },
  { value: "Supervisor" },
  { value: "Sócio Proprietário" },
];

const OCCUPATION_NATURES = [
  { value: "Assalariado Empresa Privada" },
  { value: "Assalariado Órgão Público" },
  { value: "Autônomo com Comprovação de Renda" },
  { value: "Autônomo sem Comprovação de Renda" },
  { value: "Profissional Liberal" },
  { value: "Empresário / Microempresário" },
  { value: "Aposentado / Pensionista" },
  { value: "Militar" },
  { value: "Do Lar" },
  { value: "Estudante" },
];

type AdminProfile = {
  fullName: string;
  email: string;
  status?: string;
  role?: string;
  nature?: string;
  createdAt?: string;
};

export default function ConfiguracoesAdminPage() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Falha ao carregar perfil.");
      }

      const profileData = {
        fullName: data.fullName ?? "",
        email: data.email ?? "",
        status: data.status ?? "",
        role: data.role ?? "",
        nature: data.nature ?? "",
        createdAt: data.createdAt ?? "",
      };
      setProfile(profileData);
      profileForm.setFieldsValue(profileData);
    } catch (error) {
      console.error("[admin][config] loadProfile", error);
      message.error(error instanceof Error ? error.message : "Erro ao carregar perfil.");
    } finally {
      setLoadingProfile(false);
    }
  }, [profileForm]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async (values: any) => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível salvar o perfil.");
      }
      message.success("Perfil atualizado com sucesso!");
      loadProfile();
    } catch (error) {
      console.error("[admin][config] saveProfile", error);
      message.error(error instanceof Error ? error.message : "Erro ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível alterar a senha.");
      }
      message.success("Senha alterada com sucesso!");
      passwordForm.resetFields();
    } catch (error) {
      console.error("[admin][config] changePassword", error);
      message.error(error instanceof Error ? error.message : "Erro ao alterar senha.");
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("pt-BR");
  };

  const getStatusTag = (status?: string) => {
    const s = (status ?? "").toUpperCase();
    if (s === "ATIVO" || s === "ACTIVE") return <Tag color="success">Ativo</Tag>;
    if (s === "PENDENTE") return <Tag color="warning">Pendente</Tag>;
    return <Tag color="default">{status || "Não informado"}</Tag>;
  };

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #134B73 0%, #0f3c5a 100%)', 
          padding: '40px 32px', 
          marginBottom: '32px',
          borderRadius: '0 0 16px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Row gutter={[24, 24]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space size={24} align="start">
              <Avatar 
                size={80} 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }} 
              />
              <div style={{ marginTop: 4 }}>
                <Typography.Text style={{ color: 'rgba(224, 242, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '12px', fontWeight: 600 }}>
                  Painel Administrativo
                </Typography.Text>
                <Typography.Title level={2} style={{ color: 'white', margin: '4px 0 12px 0' }}>
                  Configurações do Perfil
                </Typography.Title>
                <Space separator={<Divider orientation="vertical" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />}>
                  {getStatusTag(profile?.status)}
                  <Space style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    <SafetyCertificateOutlined />
                    <Typography.Text style={{ color: 'inherit' }}>Ambiente Seguro</Typography.Text>
                  </Space>
                  <Space style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    <CheckCircleOutlined />
                    <Typography.Text style={{ color: 'inherit' }}>Registrado em {formatDate(profile?.createdAt)}</Typography.Text>
                  </Space>
                </Space>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Card 
              style={{ 
                background: 'rgba(255, 255, 255, 0.08)', 
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)'
              }} 
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                <Row justify="space-between">
                  <Typography.Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Nível de Acesso</Typography.Text>
                  <Tag color="blue" style={{ margin: 0 }}>{profile?.role || 'Painel Admin'}</Tag>
                </Row>
                <Divider style={{ margin: 0, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                <Row justify="space-between" align="middle">
                  <Typography.Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Email Principal</Typography.Text>
                  <Typography.Text ellipsis style={{ maxWidth: 180, color: 'white', fontWeight: 500 }}>{profile?.email || '--'}</Typography.Text>
                </Row>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      <div style={{ padding: '0 32px' }}>
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={16}>
            <Card 
              title={<Space><SolutionOutlined /> Informações Pessoais</Space>}
              variant="borderless"
              style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
            >
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleSaveProfile}
                initialValues={profile || {}}
              >
                {loadingProfile ? (
                   <Skeleton active paragraph={{ rows: 4 }} />
                ) : (
                  <>
                    <Row gutter={24}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="fullName"
                          label="Nome Completo"
                          rules={[{ required: true, message: 'Por favor, insira seu nome completo' }]}
                        >
                          <Input prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Seu nome" size="large" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="email"
                          label="Endereço de E-mail"
                          rules={[
                            { required: true, message: 'Por favor, insira seu e-mail' },
                            { type: 'email', message: 'Por favor, insira um e-mail válido' }
                          ]}
                        >
                          <Input prefix={<MailOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="seu.email@exemplo.com" size="large" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="role"
                          label="Função/Cargo"
                          rules={[{ required: true, message: 'Por favor, informe sua função ou cargo' }]}
                        >
                          <AutoComplete
                            options={COMMON_ROLES}
                            placeholder="Seu cargo na empresa"
                            filterOption={(inputValue, option) =>
                              option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                          >
                            <Input prefix={<IdcardOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} size="large" />
                          </AutoComplete>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="nature"
                          label="Natureza"
                          rules={[{ required: true, message: 'Por favor, informe a natureza' }]}
                        >
                          <AutoComplete
                            options={OCCUPATION_NATURES}
                            placeholder="Selecione ou digite a natureza"
                            filterOption={(inputValue, option) =>
                              option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                          >
                            <Input prefix={<SolutionOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} size="large" />
                          </AutoComplete>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="Status da Conta">
                          <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
                            {getStatusTag(profile?.status)}
                          </div>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Divider />
                    <Space align="center" size={16}>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={savingProfile}
                        size="large"
                        style={{ background: '#134B73', minWidth: 160 }}
                      >
                        Salvar Alterações
                      </Button>
                      <Typography.Text type="secondary" style={{ fontSize: '13px' }}>
                        <InfoCircleOutlined /> As alterações serão aplicadas em todo o ecossistema Grota.
                      </Typography.Text>
                    </Space>
                  </>
                )}
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card 
              title={<Space><LockOutlined /> Segurança</Space>}
              variant="borderless"
              style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordChange}
              >
                <Form.Item
                  name="oldPassword"
                  label="Senha Atual"
                  rules={[{ required: true, message: 'Por favor, insira sua senha atual' }]}
                >
                  <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="••••••••" size="large" />
                </Form.Item>
                <Form.Item
                  name="newPassword"
                  label="Nova Senha"
                  rules={[
                    { required: true, message: 'Por favor, insira a nova senha' },
                    { min: 6, message: 'A senha deve ter pelo menos 6 caracteres' }
                  ]}
                >
                  <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Nova Senha" size="large" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Confirmar Nova Senha"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Por favor, confirme sua nova senha' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('As senhas não coincidem'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Repetir Senha" size="large" />
                </Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={changingPassword} 
                  block 
                  size="large"
                  style={{ background: '#134B73', marginTop: 8 }}
                >
                  Atualizar Senha
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>

        <Row gutter={[32, 32]} style={{ marginTop: 32 }}>
          <Col xs={24} md={12}>
            <Card 
              title={<Space><CheckCircleOutlined /> Boas Práticas</Space>}
              variant="borderless"
              style={{ height: '100%', borderRadius: '12px' }}
              styles={{ body: { paddingTop: 0 } }}
            >
              <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                <li style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space align="start">
                    <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
                    <Typography.Text type="secondary">Mantenha seu e-mail corporativo atualizado para receber alertas críticos.</Typography.Text>
                  </Space>
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space align="start">
                    <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
                    <Typography.Text type="secondary">Crie senhas fortes misturando letras, números e caracteres especiais.</Typography.Text>
                  </Space>
                </li>
                <li style={{ padding: '12px 0' }}>
                  <Space align="start">
                    <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
                    <Typography.Text type="secondary">Nunca compartilhe suas credenciais de acesso com outros colaboradores.</Typography.Text>
                  </Space>
                </li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card 
              title={<Space><InfoCircleOutlined /> Histórico da Conta</Space>}
              variant="borderless"
              style={{ height: '100%', borderRadius: '12px' }}
            >
               <Row justify="space-between" style={{ padding: '8px 0' }}>
                <Typography.Text type="secondary">Perfil de Usuário</Typography.Text>
                <Typography.Text strong>{profile?.role || 'Administrador'}</Typography.Text>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between" style={{ padding: '8px 0' }}>
                <Typography.Text type="secondary">Status de Verificação</Typography.Text>
                {getStatusTag(profile?.status)}
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between" style={{ padding: '8px 0' }}>
                <Typography.Text type="secondary">Membro desde</Typography.Text>
                <Typography.Text strong>{formatDate(profile?.createdAt)}</Typography.Text>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
               <Row justify="space-between" style={{ padding: '8px 0' }}>
                <Typography.Text type="secondary">Última atualização</Typography.Text>
                <Typography.Text strong>{new Date().toLocaleDateString('pt-BR')}</Typography.Text>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
