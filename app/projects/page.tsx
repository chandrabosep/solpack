"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingModel, Currency } from "@/types/constants";
import type { ProjectSummary } from "@/types/projects";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectCard } from "@/components/projects/project-card";
import { NewProjectCard } from "@/components/projects/new-project-card";
import { useWalletAddress } from "@/lib/auth/use-wallet-address";
import { useProjectsQuery } from "@/controllers/projects.query";
import { useCreateProjectMutation } from "@/controllers/projects.mutations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();
  const walletAddress = useWalletAddress();
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

  const { data, isLoading: loading, error } = useProjectsQuery(
    walletAddress ?? undefined,
  );
  const projects: ProjectSummary[] = data?.projects ?? [];

  const createProject = useCreateProjectMutation(walletAddress ?? undefined, {
    onSuccess: (project) => {
      setOpen(false);
      setName("");
      setPrice("0.1");
      setPaymentAddress("");
      router.push(`/projects/${project.id}`);
    },
    onError: (err) => setMessage(err.message ?? "Unable to create project."),
  });

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!walletAddress) return;
    setMessage("");
    createProject.mutate({
      name,
      pricingModel,
      price: Number(price),
      paymentAddress: paymentAddress.trim(),
      currency,
    });
  };

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your packages, set pricing, and rotate API keys.
          </p>
        </div>
        {walletAddress ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Add project
            </Button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
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
                onSubmit={submit}
                submitLabel={createProject.isPending ? "Creating…" : "Create"}
              />
              {message ? <p className="text-sm text-rose-300">{message}</p> : null}
            </DialogContent>
          </Dialog>
        ) : null}
      </header>

      <section>
        {!walletAddress ? (
          <p className="text-sm text-muted-foreground">
            Connect your wallet to see and manage projects.
          </p>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-[160px] animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-rose-300">{error.message}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
            <NewProjectCard onClick={() => setOpen(true)} />
          </div>
        )}
      </section>
    </main>
  );
}
