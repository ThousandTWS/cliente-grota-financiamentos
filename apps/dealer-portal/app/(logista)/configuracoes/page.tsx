"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Tabs,
  Row,
  Col,
  Upload,
  message,
  Tag,
  Descriptions,
  Space,
  Divider,
  Typography,
  Avatar,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
  BuildOutlined,
  SafetyOutlined,
  UserOutlined,
  LockOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

type Address = {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
};

type DealerProfile = {
  fullNameEnterprise: string;
  birthData: string;
  cnpj: string;
  address: Address;
};

type DealerDetails = DealerProfile & {
  email?: string;
  phone?: string;
  enterprise?: string;
  referenceCode?: string;
  status?: string;
  createdAt?: string;
  logoUrl?: string;
};

const emptyAddress: Address = {
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
};

const defaultProfile: DealerProfile = {
  fullNameEnterprise: "",
  birthData: "",
  cnpj: "",
  address: emptyAddress,
};

function ConfiguracoesPage() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [dealer, setDealer] = useState<DealerDetails>({
    ...defaultProfile,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/dealers/details", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Falha ao carregar dados.");
        }

        const address: Address = {
          street: data.address?.street ?? "",
          number: data.address?.number ?? "",
          complement: data.address?.complement ?? "",
          neighborhood: data.address?.neighborhood ?? "",
          city: data.address?.city ?? "",
          state: data.address?.state ?? "",
          zipCode: data.address?.zipCode ?? "",
        };

        const details: DealerDetails = {
          fullNameEnterprise: data.fullNameEnterprise ?? data.enterprise ?? "",
          birthData: data.birthData ?? "",
          cnpj: data.cnpj ?? "",
          address,
          email: data.email ?? "",
          phone: data.phone ?? "",
          enterprise: data.enterprise ?? "",
          referenceCode: data.referenceCode ?? "",
          status: data.status ?? "",
          createdAt: data.createdAt ?? "",
          logoUrl: data.logoUrl ?? "",
        };

        setDealer(details);
        setLogoPreview(details.logoUrl || null);

        // Set form values
        profileForm.setFieldsValue({
          fullNameEnterprise: details.fullNameEnterprise,
          cnpj: details.cnpj,
          birthData: details.birthData,
          phone: details.phone,
          ...details.address,
        });
      } catch (error) {
        console.error("[config] loadProfile", error);
        message.error(
          error instanceof Error ? error.message : "Erro ao carregar dados do lojista",
        );
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [profileForm]);

  const digitsOnly = (value: string) => value.replace(/\D/g, "");

  const handleSaveProfile = async (values: any) => {
    const payload: DealerProfile = {
      fullNameEnterprise: values.fullNameEnterprise,
      birthData: values.birthData,
      cnpj: digitsOnly(values.cnpj),
      address: {
        street: values.street,
        number: values.number,
        complement: values.complement || "",
        neighborhood: values.neighborhood,
        city: values.city,
        state: values.state.toUpperCase(),
        zipCode: digitsOnly(values.zipCode),
      },
    };

    setSavingProfile(true);
    try {
      const res = await fetch("/api/dealers/profile/complete", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível salvar os dados.");
      }
      message.success("Dados do lojista atualizados com sucesso!");
    } catch (error) {
      console.error("[config] saveProfile", error);
      message.error(error instanceof Error ? error.message : "Erro ao salvar dados");
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
      console.error("[config] changePassword", error);
      message.error(error instanceof Error ? error.message : "Erro ao alterar senha");
    } finally {
      setChangingPassword(false);
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("Você pode fazer upload apenas de arquivos de imagem!");
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("A imagem deve ter menos de 5MB!");
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent auto upload
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
      if (newFileList.length > 0 && newFileList[0].originFileObj) {
        const url = URL.createObjectURL(newFileList[0].originFileObj);
        setLogoPreview(url);
      } else {
        setLogoPreview(dealer.logoUrl || null);
      }
    },
    maxCount: 1,
    listType: "picture",
    accept: "image/png,image/jpeg,image/jpg,image/webp",
  };

  const handleUploadLogo = async () => {
    if (fileList.length === 0 || !fileList[0].originFileObj) {
      message.error("Selecione um arquivo de imagem para enviar.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj);

    setUploadingLogo(true);
    try {
      const res = await fetch("/api/dealers/logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível enviar a logomarca.");
      }
      const newUrl = data.logoUrl ?? data.secureUrl ?? data.url ?? null;
      setDealer((prev) => {
        const nextUrl = newUrl || prev.logoUrl || null;
        setLogoPreview(nextUrl);
        return { ...prev, logoUrl: nextUrl || "" };
      });
      setFileList([]);
      message.success("Logomarca atualizada com sucesso!");
    } catch (error) {
      console.error("[config] uploadLogo", error);
      message.error(
        error instanceof Error ? error.message : "Erro ao enviar a logomarca",
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("pt-BR");
  };

  const getStatusColor = (status?: string) => {
    const upperStatus = (status ?? "").toUpperCase();
    if (upperStatus === "ATIVO" || upperStatus === "ACTIVE") return "success";
    if (upperStatus === "PENDENTE") return "warning";
    return "default";
  };

  const tabItems = [
    {
      key: "profile",
      label: (
        <span>
          <BuildOutlined /> Perfil da Empresa
        </span>
      ),
      children: (
        <Card variant="borderless">
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleSaveProfile}
            disabled={loadingProfile}
          >
            <Title level={5} style={{ color: "#134B73", marginBottom: 16 }}>
              Informações da Empresa
            </Title>
            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fullNameEnterprise"
                  label="Razão Social"
                  rules={[
                    { required: true, message: "Informe a razão social da empresa" },
                  ]}
                >
                  <Input placeholder="Nome completo da empresa" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="cnpj"
                  label="CNPJ"
                  rules={[
                    { required: true, message: "Informe o CNPJ" },
                    {
                      validator: (_, value) => {
                        if (!value || digitsOnly(value).length === 14) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("CNPJ deve ter 14 dígitos"),
                        );
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder="00.000.000/0000-00"
                    onChange={(e) => {
                      profileForm.setFieldValue("cnpj", digitsOnly(e.target.value));
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="birthData"
                  label="Data de Fundação"
                  rules={[
                    {
                      required: true,
                      message: "Informe a data de fundação no formato AAAA-MM-DD",
                    },
                  ]}
                >
                  <Input type="date" placeholder="AAAA-MM-DD" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="phone" label="Telefone">
                  <Input disabled placeholder="Telefone cadastrado" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5} style={{ color: "#134B73", marginBottom: 16 }}>
              <EnvironmentOutlined /> Endereço
            </Title>
            <Row gutter={[16, 8]}>
              <Col xs={24} md={16}>
                <Form.Item
                  name="street"
                  label="Logradouro"
                  rules={[{ required: true, message: "Informe o logradouro" }]}
                >
                  <Input placeholder="Rua / Avenida" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="number"
                  label="Número"
                  rules={[{ required: true, message: "Informe o número" }]}
                >
                  <Input placeholder="Número" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="complement" label="Complemento">
                  <Input placeholder="Sala / Bloco (opcional)" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="neighborhood"
                  label="Bairro"
                  rules={[{ required: true, message: "Informe o bairro" }]}
                >
                  <Input placeholder="Bairro" />
                </Form.Item>
              </Col>
              <Col xs={24} md={10}>
                <Form.Item
                  name="city"
                  label="Cidade"
                  rules={[{ required: true, message: "Informe a cidade" }]}
                >
                  <Input placeholder="Cidade" />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item
                  name="state"
                  label="UF"
                  rules={[
                    { required: true, message: "Informe a UF" },
                    { len: 2, message: "UF deve ter 2 letras" },
                  ]}
                >
                  <Input
                    placeholder="UF"
                    maxLength={2}
                    style={{ textTransform: "uppercase" }}
                    onChange={(e) => {
                      profileForm.setFieldValue(
                        "state",
                        e.target.value.toUpperCase(),
                      );
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={8}>
                <Form.Item
                  name="zipCode"
                  label="CEP"
                  rules={[
                    { required: true, message: "Informe o CEP" },
                    {
                      validator: (_, value) => {
                        if (!value || digitsOnly(value).length === 8) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("CEP deve ter 8 dígitos"));
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder="00000-000"
                    onChange={(e) => {
                      profileForm.setFieldValue("zipCode", digitsOnly(e.target.value));
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 24 }}>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={savingProfile}
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: "#134B73" }}
                >
                  Salvar alterações
                </Button>
                <Text type="secondary">
                  Campos obrigatórios: CNPJ, endereço completo e data de fundação
                </Text>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: "branding",
      label: (
        <span>
          <PictureOutlined /> Identidade Visual
        </span>
      ),
      children: (
        <Card variant="borderless">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Space orientation="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Title level={5} style={{ color: "#134B73" }}>
                    <UploadOutlined /> Logomarca do Painel
                  </Title>
                  <Paragraph type="secondary">
                    Personalize a logomarca exibida na sidebar do lojista.
                  </Paragraph>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 200,
                      height: 200,
                      margin: "0 auto 16px",
                      border: "2px dashed #134B73",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fafafa",
                      overflow: "hidden",
                    }}
                  >
                    {logoPreview ? (
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        width={180}
                        height={180}
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
                      <PictureOutlined
                        style={{ fontSize: 48, color: "#134B73", opacity: 0.5 }}
                      />
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    PNG, JPG ou WEBP até 5MB
                  </Text>
                </div>

                <Upload {...uploadProps} fileList={fileList}>
                  <Button icon={<UploadOutlined />} block>
                    Selecionar arquivo
                  </Button>
                </Upload>

                <Space style={{ width: "100%" }}>
                  <Button
                    type="default"
                    onClick={handleUploadLogo}
                    loading={uploadingLogo}
                    disabled={fileList.length === 0}
                    style={{ backgroundColor: "#ffff" }}
                  >
                    Enviar logomarca
                  </Button>
                  <Button
                    onClick={() => {
                      setFileList([]);
                      setLogoPreview(dealer.logoUrl || null);
                    }}
                    disabled={uploadingLogo}
                  >
                    Limpar seleção
                  </Button>
                </Space>

                <Paragraph type="secondary" style={{ fontSize: 12 }}>
                  O envio substitui a logo atual da sidebar. Usamos Cloudinary para
                  hospedagem segura.
                </Paragraph>
              </Space>
            </Col>

            <Col xs={24} md={12}>
              <Card
                type="inner"
                title={
                  <span>
                    <InfoCircleOutlined /> Dicas para a logo
                  </span>
                }
                style={{ background: "#f6f8fa" }}
              >
                <Space orientation="vertical" size="middle">
                  <div style={{ display: "flex", gap: 8 }}>
                    <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                    <Text>Prefira logos em fundo transparente para melhor contraste</Text>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                    <Text>Resolução mínima recomendada: 200x200 pixels</Text>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                    <Text>Formatos aceitos: PNG, JPG, WEBP</Text>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                    <Text>A logo será redimensionada automaticamente</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: "security",
      label: (
        <span>
          <SafetyOutlined /> Segurança
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <LockOutlined /> Alterar Senha
                </span>
              }
              variant="borderless"
            >
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordChange}
              >
                <Form.Item
                  name="oldPassword"
                  label="Senha Atual"
                  rules={[{ required: true, message: "Informe a senha atual" }]}
                >
                  <Input.Password placeholder="••••••••" />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label="Nova Senha"
                  rules={[
                    { required: true, message: "Informe a nova senha" },
                    { min: 6, message: "A senha deve ter pelo menos 6 caracteres" },
                  ]}
                >
                  <Input.Password placeholder="Mínimo 6 caracteres" />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirmar Nova Senha"
                  dependencies={["newPassword"]}
                  rules={[
                    { required: true, message: "Confirme a nova senha" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("newPassword") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("As senhas não coincidem"));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Repita a nova senha" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={changingPassword}
                    block
                    style={{ backgroundColor: "#134B73" }}
                  >
                    Alterar senha
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <InfoCircleOutlined /> Dicas de Segurança
                </span>
              }
              variant="borderless"
              style={{ background: "#f6f8fa" }}
            >
              <Space orientation="vertical" size="middle">
                <div style={{ display: "flex", gap: 8 }}>
                  <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                  <Text>Use um e-mail corporativo válido para notificações</Text>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                  <Text>Atualize a senha regularmente (a cada 90 dias)</Text>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                  <Text>Evite reutilizar senhas antigas ou de outros serviços</Text>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                  <Text>Use combinação de letras, números e caracteres especiais</Text>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                  <Text>Mantenha CNPJ e endereço iguais aos documentos enviados</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: "account",
      label: (
        <span>
          <UserOutlined /> Informações da Conta
        </span>
      ),
      children: (
        <Card variant="borderless" loading={loadingProfile}>
          <Space orientation="vertical" size="large" style={{ width: "100%" }}>
            <div style={{ textAlign: "center", paddingBottom: 16 }}>
              <Avatar
                size={80}
                src={logoPreview}
                icon={<BuildOutlined />}
                style={{ backgroundColor: "#134B73", marginBottom: 16 }}
              />
              <Title level={4} style={{ margin: 0 }}>
                {dealer.fullNameEnterprise || dealer.enterprise || "Sua Empresa"}
              </Title>
              <Space style={{ marginTop: 8 }}>
                <Tag color={getStatusColor(dealer.status)} icon={<CheckCircleOutlined />}>
                  {dealer.status || "Status não informado"}
                </Tag>
              </Space>
            </div>

            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Código de Referência">
                {dealer.referenceCode || "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Empresa">
                {dealer.enterprise || "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {dealer.email || "--"}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Telefone</>}>
                {dealer.phone || "--"}
              </Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> Membro desde</>}>
                {formatDate(dealer.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="CNPJ" span={2}>
                {dealer.cnpj || "--"}
              </Descriptions.Item>
              <Descriptions.Item label={<><EnvironmentOutlined /> Endereço</>} span={2}>
                {dealer.address?.street && dealer.address?.city
                  ? `${dealer.address.street}, ${dealer.address.number}${dealer.address.complement ? ` - ${dealer.address.complement}` : ""
                  } - ${dealer.address.neighborhood}, ${dealer.address.city}/${dealer.address.state
                  } - CEP ${dealer.address.zipCode}`
                  : "--"}
              </Descriptions.Item>
            </Descriptions>

            <Card
              type="inner"
              style={{ background: "#e6f4ff", borderColor: "#91caff" }}
            >
              <Space>
                <InfoCircleOutlined style={{ color: "#134B73", fontSize: 20 }} />
                <div>
                  <Text strong style={{ color: "#134B73" }}>
                    Ambiente Seguro
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Suas informações são protegidas com criptografia de ponta a ponta
                  </Text>
                </div>
              </Space>
            </Card>
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          background: "linear-gradient(135deg, #134B73 0%, #0f3c5a 50%, #0a2c45 100%)",
          padding: "32px 24px",
          marginBottom: 24,
          color: "white",
        }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={16}>
            <Space size="large" align="center">
              <Avatar
                size={64}
                src={logoPreview}
                icon={<BuildOutlined />}
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              />
              <div>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                  PAINEL GROTA
                </Text>
                <Title level={2} style={{ color: "white", margin: "4px 0 8px" }}>
                  Configurações do Painel
                </Title>
                <Space wrap>
                  <Tag color={getStatusColor(dealer.status)}>
                    {dealer.status || "Status não informado"}
                  </Tag>
                  <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                    <SafetyOutlined /> Ambiente seguro
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                    <CalendarOutlined /> Desde {formatDate(dealer.createdAt)}
                  </Text>
                </Space>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Card
              size="small"
              style={{ background: "rgba(255,255,255,0.15)", borderColor: "transparent" }}
            >
              <Descriptions column={1} size="small" colon={false}>
                <Descriptions.Item
                  label={<Text style={{ color: "rgba(255,255,255,0.8)" }}>Código Ref.</Text>}
                >
                  <Text strong style={{ color: "white" }}>
                    {dealer.referenceCode || "--"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={<Text style={{ color: "rgba(255,255,255,0.8)" }}>Empresa</Text>}
                >
                  <Text strong style={{ color: "white" }}>
                    {dealer.enterprise || "--"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={<Text style={{ color: "rgba(255,255,255,0.8)" }}>Telefone</Text>}
                >
                  <Text strong style={{ color: "white" }}>
                    {dealer.phone || "--"}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>

      <Tabs
        defaultActiveKey="profile"
        items={tabItems}
        size="large"
        tabBarStyle={{ marginBottom: 24, marginLeft: 24 }}

      />
    </div>
  );
}

export default ConfiguracoesPage;
