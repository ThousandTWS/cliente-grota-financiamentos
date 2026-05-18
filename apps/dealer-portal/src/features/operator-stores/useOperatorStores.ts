"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import {
  createDealer,
  fetchAllDealers,
  type DealerSummary,
} from "@/application/services/DealerServices/dealerService";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import {
  createSeller,
  fetchOperatorPanelSellers,
  type Seller,
} from "@/application/services/Sellers/sellerService";
import {
  buildOperatorStoreMetrics,
  buildOperatorStoreRows,
  toDealerPayload,
  toSellerPayload,
} from "./model";
import type {
  DealerFormValues,
  DealerProposalReference,
  OperatorStoreRow,
  SellerFormValues,
} from "./types";

export function useOperatorStores() {
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [proposals, setProposals] = useState<DealerProposalReference[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDealer, setIsSavingDealer] = useState(false);
  const [isSavingSeller, setIsSavingSeller] = useState(false);
  const [dealerModalOpen, setDealerModalOpen] = useState(false);
  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<OperatorStoreRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [sellersList, dealersList, proposalsList] = await Promise.all([
        fetchOperatorPanelSellers(),
        fetchAllDealers(),
        fetchProposals(),
      ]);

      setDealers(dealersList);
      setProposals(proposalsList);
      setSellers(Array.isArray(sellersList) ? sellersList : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const rows = useMemo(
    () => buildOperatorStoreRows(dealers, sellers, proposals),
    [dealers, proposals, sellers],
  );

  const metrics = useMemo(
    () => buildOperatorStoreMetrics(rows, sellers, proposals),
    [proposals, rows, sellers],
  );

  const openDealerModal = useCallback(() => {
    setDealerModalOpen(true);
  }, []);

  const closeDealerModal = useCallback(() => {
    setDealerModalOpen(false);
  }, []);

  const openSellerModal = useCallback((dealer?: OperatorStoreRow) => {
    setSelectedDealer(dealer ?? null);
    setSellerModalOpen(true);
  }, []);

  const closeSellerModal = useCallback(() => {
    setSellerModalOpen(false);
    setSelectedDealer(null);
  }, []);

  const handleCreateDealer = useCallback(
    async (values: DealerFormValues) => {
      setIsSavingDealer(true);
      try {
        await createDealer(toDealerPayload(values));
        message.success("Loja cadastrada e vinculada ao operador.");
        setDealerModalOpen(false);
        await loadData();
      } catch (err) {
        message.error(
          err instanceof Error ? err.message : "Nao foi possivel cadastrar a loja.",
        );
      } finally {
        setIsSavingDealer(false);
      }
    },
    [loadData],
  );

  const handleCreateSeller = useCallback(
    async (values: SellerFormValues) => {
      setIsSavingSeller(true);
      try {
        await createSeller(toSellerPayload(values));
        message.success("Vendedor cadastrado e vinculado a loja.");
        setSellerModalOpen(false);
        setSelectedDealer(null);
        await loadData();
      } catch (err) {
        message.error(
          err instanceof Error ? err.message : "Nao foi possivel cadastrar o vendedor.",
        );
      } finally {
        setIsSavingSeller(false);
      }
    },
    [loadData],
  );

  return {
    error,
    isLoading,
    isSavingDealer,
    isSavingSeller,
    dealerModalOpen,
    sellerModalOpen,
    selectedDealer,
    rows,
    metrics,
    actions: {
      openDealerModal,
      closeDealerModal,
      openSellerModal,
      closeSellerModal,
      createDealer: handleCreateDealer,
      createSeller: handleCreateSeller,
    },
  };
}
