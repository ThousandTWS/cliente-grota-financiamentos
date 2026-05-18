"use client";

import { useEffect } from "react";
import { Form, Input, Modal } from "antd";
import type { DealerFormValues } from "../../types";

type DealerFormModalProps = {
  confirmLoading: boolean;
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: DealerFormValues) => Promise<void>;
};

export function DealerFormModal({
  confirmLoading,
  open,
  onCancel,
  onSubmit,
}: DealerFormModalProps) {
  const [form] = Form.useForm<DealerFormValues>();

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [form, open]);

  return (
    <Modal
      title="Nova loja"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Cadastrar loja"
      confirmLoading={confirmLoading}
      width={860}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{ state: "SP" }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Form.Item
            name="enterprise"
            label="Nome fantasia"
            rules={[{ required: true }]}
          >
            <Input placeholder="Nome da loja" />
          </Form.Item>
          <Form.Item name="razaoSocial" label="Razao social">
            <Input placeholder="Razao social" />
          </Form.Item>
          <Form.Item
            name="fullName"
            label="Responsavel"
            rules={[{ required: true }]}
          >
            <Input placeholder="Nome completo" />
          </Form.Item>
          <Form.Item name="phone" label="Telefone" rules={[{ required: true }]}>
            <Input placeholder="11999999999" maxLength={15} />
          </Form.Item>
          <Form.Item
            name="cnpj"
            label="CNPJ"
            rules={[{ len: 14, message: "Informe 14 digitos." }]}
          >
            <Input placeholder="00000000000000" maxLength={18} />
          </Form.Item>
          <Form.Item
            name="password"
            label="Senha inicial"
            rules={[{ required: true }, { min: 6 }, { max: 8 }]}
          >
            <Input.Password placeholder="6 a 8 caracteres" />
          </Form.Item>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Form.Item name="zipCode" label="CEP">
            <Input placeholder="00000000" />
          </Form.Item>
          <Form.Item name="street" label="Endereco" className="md:col-span-2">
            <Input placeholder="Rua, avenida..." />
          </Form.Item>
          <Form.Item name="number" label="Numero">
            <Input placeholder="123" />
          </Form.Item>
          <Form.Item name="neighborhood" label="Bairro">
            <Input />
          </Form.Item>
          <Form.Item name="city" label="Cidade">
            <Input />
          </Form.Item>
          <Form.Item name="state" label="UF">
            <Input maxLength={2} />
          </Form.Item>
          <Form.Item name="complement" label="Complemento">
            <Input />
          </Form.Item>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Form.Item name="partnerName" label="Socio/procurador">
            <Input placeholder="Nome" />
          </Form.Item>
          <Form.Item name="partnerCpf" label="CPF do socio/procurador">
            <Input placeholder="00000000000" />
          </Form.Item>
        </div>
        <Form.Item name="observation" label="Observacoes">
          <Input.TextArea rows={3} placeholder="Observacoes internas" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
