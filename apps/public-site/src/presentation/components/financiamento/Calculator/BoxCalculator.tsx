"use client";

import React from "react";
import { Calculator, Check, Loader2, Search } from "lucide-react";
import { useBoxCalculator } from "@/src/application/core/hooks/useBoxCalculator";
import { formatCurrencyInput } from "@/src/application/core/utils/currency/currencyMask";
import { formatCurrency } from "@/src/application/core/utils/currency/formatCurrency";
import { parseCurrency } from "@/src/application/core/utils/currency/parseCurrency";
import Link from "next/link";

function BoxCalculator() {
  const { vehicleInfo, loading, vehiclePlate, setVehiclePlate, error, vehicleValue, setVehicleValue, downPayment, setDownPayment, months, setMonths, monthlyPayment } = useBoxCalculator();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-oid="xc5-k:l">
      <div
        className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl overflow-hidden"
        data-oid="h3sdzvr">

        <div
          className="bg-[#1B4B7C] text-white py-8 px-6 md:px-10"
          data-oid="q2b7sdn">

          <div
            className="flex items-center justify-center gap-3 mb-3"
            data-oid="fjnzuxo">

            <Calculator size={32} data-oid="fwqhdpc" />
            <h2 className="text-3xl md:text-4xl font-bold" data-oid="bzwvgvx">
              Simulador de Financiamento
            </h2>
          </div>
          <p className="text-center text-blue-200 text-lg" data-oid=":-uihgp">
            Calcule sua parcela mensal e planeje seu financiamento
          </p>
        </div>

        <div className="p-6 md:p-10" data-oid=":c32kxn">
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            data-oid="::.1zek">

            <div className="space-y-6 relative" data-oid="5y2o:25">
              <div className="flex flex-col gap-3">
                <div
                  className="space-y-3 bg-white rounded-lg p-5 shadow-md"
                  data-oid="ohbx_tf">
                    <div
                      className="flex justify-between items-center py-2 border-b border-gray-200"
                      data-oid="a8u_eg6">
                      <h3 className="text-gray-900 font-bold">Informações do Veículo</h3>
                    </div>
                    <div
                      className="flex justify-between items-center py-2"
                      data-oid="a8u_eg6">
                      <span
                        className="text-gray-700 font-medium"
                        data-oid=":rleid.">

                        Modelo:
                      </span>
                      <span className="text-gray-900 font-bold" data-oid=":w8rnkn">
                        {vehicleInfo?.modelo
                          ? vehicleInfo.modelo
                          : loading
                          ? <Loader2 className="animate-spin text-[#1B4B7C]"/> 
                          : "-"
                        }
                      </span>
                    </div>
                    <div
                      className="flex justify-between items-center py-2"
                      data-oid="a8u_eg6">
                      <span
                        className="text-gray-700 font-medium"
                        data-oid=":rleid.">

                        Cor:
                      </span>
                      <span className="text-gray-900 font-bold" data-oid=":w8rnkn">
                        {vehicleInfo?.cor
                          ? vehicleInfo.cor
                          : loading
                          ? <Loader2 className="animate-spin text-[#1B4B7C]"/> 
                          : "-"
                        }
                      </span>
                    </div>
                    <div
                      className="flex justify-between items-center py-2"
                      data-oid="a8u_eg6">
                      <span
                        className="text-gray-700 font-medium"
                        data-oid=":rleid.">

                        Ano:
                      </span>
                      <span className="text-gray-900 font-bold" data-oid=":w8rnkn">
                        {vehicleInfo?.ano_modelo
                          ? vehicleInfo.ano_modelo
                          : loading
                          ? <Loader2 className="animate-spin text-[#1B4B7C]"/> 
                          : "-"
                        }
                      </span>
                    </div>
                </div>
                <div data-oid="r3:w5y4" className="relative">
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    data-oid="6sj4pey">

                    Placa do Veículo
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full px-4 py-3 border-2 mb-1 border-gray-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-[#1B4B7C] focus:border-transparent transition-all text-gray-800 font-medium text-lg"
                    placeholder="MPA7466"
                    data-oid="ievfkz-" />
                  <div className="absolute top-11 right-3">
                    {
                      loading
                      ? <Loader2 className="animate-spin text-[#1B4B7C]"/>
                      : vehicleInfo.modelo
                      ? <Check className="text-green-700"/>
                      : <Search />
                    }
                  </div>
                  {
                    loading
                    ? <span className="text-gray-700 text-xs font-semibold">Buscando veículo...</span>
                    : vehicleInfo.modelo
                    ? <span className="text-green-700 text-xs font-semibold">Veículo encontrado!</span>
                    : error && <span className="text-red-700 text-xs font-semibold">Veículo não encontrado ou placa inválida</span>
                  }
                </div>
              </div>

              <div data-oid="r3:w5y4">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  data-oid="6sj4pey">

                  Valor do Veículo
                </label>
                <input
                  type="text"
                  value={vehicleValue}
                  onChange={(e) => setVehicleValue(formatCurrencyInput(e.target.value))}
                  className="w-full px-4 py-3 border-2 mb-1 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4B7C] focus:border-transparent transition-all text-gray-800 font-medium text-lg"
                  placeholder="R$ 0,00"
                  data-oid="ievfkz-" />
                  {/* {vehicleInfo.valor_fipe && <span className="text-gray-700 text-xs font-semibold">Valor sugerido pela tabela FIPE: {vehicleInfo.valor_fipe}</span>} */}
              </div>

              <div data-oid="2bjyyil">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  data-oid=".lvy-jt">

                  Valor de Entrada
                </label>
                <input
                  type="text"
                  value={downPayment}
                  onChange={(e) => setDownPayment(formatCurrencyInput(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4B7C] focus:border-transparent transition-all text-gray-800 font-medium text-lg"
                  placeholder="R$ 0,00"
                  data-oid="ubem697" />

              </div>

              <div data-oid="5dk4onf">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  data-oid="0f460x:">

                  Prazo (meses)
                </label>
                <select
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4B7C] focus:border-transparent transition-all text-gray-800 font-medium text-lg"
                  data-oid="h5q8pgq">

                  <option value="12" data-oid="q5h2nit">
                    12 meses
                  </option>
                  <option value="24" data-oid="q-v9onk">
                    24 meses
                  </option>
                  <option value="36" data-oid="veqq95a">
                    36 meses
                  </option>
                  <option value="48" data-oid="h:lloej">
                    48 meses
                  </option>
                  <option value="60" data-oid="mt0i1ug">
                    60 meses
                  </option>
                </select>
              </div>
            </div>

            {/* Results */}
            <div
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 md:p-8 flex flex-col justify-center"
              data-oid="0nyfkux">

              <div className="text-center mb-6" data-oid="2bdpdl:">
                <p
                  className="text-gray-700 text-sm font-semibold mb-2"
                  data-oid="z-uzxxu">

                  Parcela Mensal Estimada
                </p>
                <p
                  className="text-5xl md:text-6xl font-bold text-[#1B4B7C]"
                  data-oid="_1eoh:w">

                  {formatCurrency(monthlyPayment)}
                </p>
              </div>

              <div
                className="space-y-3 bg-white rounded-lg p-5 shadow-md"
                data-oid="ohbx_tf">

                <div
                  className="flex justify-between items-center py-2 border-b border-gray-200"
                  data-oid="a8u_eg6">

                  <span
                    className="text-gray-700 font-medium"
                    data-oid=":rleid.">

                    Valor Total Financiado:
                  </span>
                  <span className="text-gray-900 font-bold" data-oid=":w8rnkn">
                    {formatCurrency(
                      parseCurrency(vehicleValue) - parseCurrency(downPayment)
                    )}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center py-2 border-b border-gray-200"
                  data-oid="wk33cp_">

                  <span
                    className="text-gray-700 font-medium"
                    data-oid="r75vxiv">

                    Total a Pagar:
                  </span>
                  <span className="text-gray-900 font-bold" data-oid="fcjj3gc">
                    {formatCurrency(monthlyPayment * parseInt(months))}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center py-2"
                  data-oid="6f_xvry">

                  <span
                    className="text-gray-700 font-medium"
                    data-oid="kc2yabf">

                    Taxa de Juros:
                  </span>
                  <span className="text-[#1B4B7C] font-bold" data-oid="iy3-5ls">
                    1,5% a.m.
                  </span>
                </div>
              </div>
              <Link href="https://api.whatsapp.com/send?phone=5519992837133&text=Ol%C3%A1!%20Tudo%20bem%3F%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20finaciamento%20de%20ve%C3%ADculos." target="_blank">
             
              <button
                className="mt-6 w-full bg-[#1B4B7C] hover:bg-[#153a5f] text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer"
                data-oid="fao713q">

                Solicitar Proposta
              </button>
               </Link>
            </div>
          </div>

          <div
            className="mt-8 p-4 bg-blue-50 border-l-4 border-[#1B4B7C] rounded"
            data-oid="claeqnw">

            <p className="text-sm text-gray-700" data-oid="8e64fyb">
              <strong data-oid="q72isjo">Nota:</strong> Os valores apresentados
              são meramente ilustrativos. As condições finais podem variar
              conforme análise de crédito e política comercial vigente.
            </p>
          </div>
        </div>
      </div>
    </div>);

}

export default BoxCalculator;