import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldAlert, PhoneCall, Phone, Heart } from "lucide-react";

import { useState } from "react";

interface Props {
  label?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StationHelp({ label = "Need Help at the Station?", open: controlledOpen, onOpenChange }: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="w-full h-16 text-lg rounded-2xl bg-primary text-primary-foreground shadow-lg font-extrabold"
            data-testid="contact-staff-btn"
          >
            <ShieldAlert className="mr-3 w-6 h-6 shrink-0" /> {label}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="rounded-3xl max-w-[90vw] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-extrabold">Get Help Now</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <Card className="rounded-2xl border-none bg-muted/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Nearest Help Desk</p>
                <p className="font-bold text-lg">Station Agent Booth — near the fare gates</p>
                <p className="text-sm text-muted-foreground">Available during station hours</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div>
              <Button asChild className="w-full h-14 rounded-xl text-base font-bold">
                <a href="tel:5104646000" data-testid="call-general">
                  <Phone className="w-5 h-5 mr-2 shrink-0" /> General Help: 510-464-6000
                </a>
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-1.5">
                BART customer service — questions, directions, lost &amp; found.
              </p>
            </div>

            <div>
              <Button asChild variant="destructive" className="w-full h-14 rounded-xl text-base font-bold">
                <a href="tel:5104647000" data-testid="call-emergency">
                  <PhoneCall className="w-5 h-5 mr-2 shrink-0" /> BART Police: 510-464-7000
                </a>
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-1.5">
                24/7 safety line. For a life-threatening emergency, call 911.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-center text-sm font-semibold text-muted-foreground">Show this to a station agent:</p>
            <div className="p-5 rounded-2xl border-4 border-primary/30 bg-primary/5 text-center">
              <p className="text-xl font-bold leading-relaxed">
                "Hi, I need help finding my BART train. I may need simple step-by-step directions."
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
