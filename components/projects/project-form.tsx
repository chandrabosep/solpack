"use client";

import type { PricingModel, Currency } from "@/types/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const pricingOptions: PricingModel[] = ["per_device", "subscription", "per_user"];
const currencyOptions: Currency[] = ["USDC", "SOL"];

function pricingOptionLabel(model: PricingModel): string {
  return (
    {
      per_device: "Per device",
      subscription: "Subscription",
      per_user: "Per user",
    } as Record<PricingModel, string>
  )[model] ?? model;
}

export function ProjectForm(props: {
  name: string;
  price: string;
  paymentAddress: string;
  pricingModel: PricingModel;
  currency: Currency;
  onNameChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onPaymentAddressChange: (v: string) => void;
  onPricingChange: (v: PricingModel) => void;
  onCurrencyChange: (v: Currency) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitLabel?: string;
}) {
  return (
    <form className="space-y-4" onSubmit={props.onSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label>Project name</Label>
        <Input
          value={props.name}
          onChange={(e) => props.onNameChange(e.target.value)}
          placeholder="my-paid-package"
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Recommended: include a clear paid suffix in the package name (e.g.
          <code className="mx-1">-paid</code>) so installers know up front.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Price</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={props.price}
            onChange={(e) => props.onPriceChange(e.target.value)}
            placeholder="0.10"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Currency</Label>
          <Select
            value={props.currency}
            onValueChange={(v) => props.onCurrencyChange(v as Currency)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Solana payout address</Label>
        <Input
          className="font-mono text-xs"
          value={props.paymentAddress}
          onChange={(e) => props.onPaymentAddressChange(e.target.value)}
          placeholder="Base58 address (44 chars)"
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Funds settle here on-chain. Defaults to your connected wallet.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Pricing model</Label>
        <Select
          value={props.pricingModel}
          onValueChange={(v) => props.onPricingChange(v as PricingModel)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pricingOptions.map((m) => (
              <SelectItem key={m} value={m}>
                {pricingOptionLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        {props.submitLabel ?? "Create"}
      </Button>
    </form>
  );
}
