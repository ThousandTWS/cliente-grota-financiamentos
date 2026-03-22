"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { BaseRecord, HttpError } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import type { DefaultValues, FieldValues } from "react-hook-form";
import type { ZodType } from "zod";

type UseAdminCreateFormParams<
  _TRecord extends BaseRecord,
  TValues extends FieldValues,
> = {
  resource: string;
  schema: ZodType<TValues>;
  defaultValues: DefaultValues<TValues>;
};

export function useAdminCreateForm<
  TRecord extends BaseRecord,
  TValues extends FieldValues,
>({
  resource,
  schema,
  defaultValues,
}: UseAdminCreateFormParams<TRecord, TValues>) {
  return useForm<TRecord, HttpError, TValues>({
    refineCoreProps: {
      resource,
      action: "create",
      redirect: false,
      invalidates: ["list"],
      successNotification: false,
      errorNotification: false,
    },
    resolver: zodResolver(schema as never),
    defaultValues,
  });
}
