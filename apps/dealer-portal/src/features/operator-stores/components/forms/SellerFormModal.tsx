"use client";

import { useEffect } from "react";
import { Form, Input, Modal, Select } from "antd";
import type { SellerFormValues } from "../../types";

type SellerFormModalProps = {
  confirmLoading: boolean;
  dealerOptions: Array<{ value: number; label: string }>;
  open: boolean;
  selectedDealerId?: number;
  onCancel: () => void;
  onSubmit: (values: SellerFormValues) => Promise<void>;
};

export function SellerFormModal({
  confirmLoading,
  dealerOptions,
  open,
  selectedDealerId,
  onCancel,
  onSubmit,
}: SellerFormModalProps) {
  const [form] = Form.useForm<SellerFormValues>();

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      dealerId: selectedDealerId,
      state: "SP",
    });
  }, [form, open, selectedDealerId]);

  return (
    <Modal
      title="Novo vendedor"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Cadastrar vendedor"
      confirmLoading={confirmLoading}
      width={780}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item name="dealerId" label="Loja" rules={[{ required: true }]}>
          <Select placeholder="Selecione a loja" options={dealerOptions} />
        </Form.Item>

        <div className="grid gap-3 md:grid-cols-2">
          <Form.Item name="fullName" label="Nome" rules={[{ required: true }]}>
            <Input placeholder="Nome completo" />
          </Form.Item>
          <Form.Item
            name="email"
            label="E-mail"
            rules={[{ required: true }, { type: "email" }]}
          >
            <Input placeholder="vendedor@email.com" />
          </Form.Item>
          <Form.Item name="phone" label="Telefone" rules={[{ required: true }]}>
            <Input placeholder="11999999999" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Senha inicial"
            rules={[{ required: true }, { min: 6 }, { max: 8 }]}
          >
            <Input.Password placeholder="6 a 8 caracteres" />
          </Form.Item>
          <Form.Item name="CPF" label="CPF">
            <Input placeholder="00000000000" />
          </Form.Item>
          <Form.Item name="birthData" label="Data de nascimento">
            <Input type="date" />
          </Form.Item>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Form.Item name="zipCode" label="CEP">
            <Input />
          </Form.Item>
          <Form.Item name="street" label="Endereco" className="md:col-span-2">
            <Input />
          </Form.Item>
          <Form.Item name="number" label="Numero">
            <Input />
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
      </Form>
    </Modal>
  );
}
