"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingModel, Currency } from "@/types/constants";
import { ProjectForm } from "@/components/projects/project-form";
import { useCreateProjectMutation } from "@/controllers/projects.mutations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CreatePackageButton({
  walletAddress,
  onCreated,
  variant = "default",
}: {
  walletAddress: string;
  onCreated: () => void;
  variant?: "default" | "inline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0.1");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [pricingModel, setPricingModel] = useState<PricingModel>("per_device");
  const [currency, setCurrency] = useState<Currency>("USDC");

  useEffect(() => {
    if (open && walletAddress) {
      setPaymentAddress((prev) => prev || walletAddress);
    }
  }, [open, walletAddress]);

  const createProject = useCreateProjectMutation(walletAddress, {
    onSuccess: (project) => {
      setOpen(false);
      setName("");
      setPrice("0.1");
      setPaymentAddress("");
      setPricingModel("per_device");
      setCurrency("USDC");
      onCreated();
      router.push(`/projects/${project.id}`);
    },
    onError: (err) => setMessage(err.message ?? "Failed to create package."),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    createProject.mutate({
      name,
      pricingModel,
      price: Number(price),
      paymentAddress: paymentAddress.trim(),
      currency,
    });
  };

  const isInline = variant === "inline";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="default"
        size="default"
        onClick={() => setOpen(true)}
        className={isInline ? "mt-4" : ""}
      >
        <Plus className="size-4" />
        Create package
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create package</DialogTitle>
        </DialogHeader>
        <ProjectForm
          name={name}
          price={price}
          paymentAddress={paymentAddress}
          pricingModel={pricingModel}
          currency={currency}
          onNameChange={setName}
          onPriceChange={setPrice}
          onPaymentAddressChange={setPaymentAddress}
          onPricingChange={setPricingModel}
          onCurrencyChange={setCurrency}
          onSubmit={handleSubmit}
          submitLabel={createProject.isPending ? "Creating…" : "Create"}
        />
        {message ? (
          <p className="text-sm text-rose-300">{message}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
