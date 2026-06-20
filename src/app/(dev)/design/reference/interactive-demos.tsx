"use client";

import { useState } from "react";
import { toast } from "sonner";

import { PasswordStrengthMeter } from "@/components/shared/password-strength-meter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

import { Row, Spec } from "./reference-ui";

/**
 * The interactive corner of the Components reference: the few real primitives
 * that need client state or an event handler (toast is imperative; OTP and the
 * strength meter are controlled). Everything else composes fine in the server
 * page. All imported from production source, so it is the live component.
 */

export function ToastDemo() {
  return (
    <Spec label="Toast" hint="sonner · toast()">
      <Row>
        <Button variant="outline" size="sm" onClick={() => toast.success("Saved")}>
          Success
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.error("Something went wrong")}
        >
          Error
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast("Heads up")}>
          Default
        </Button>
      </Row>
    </Spec>
  );
}

export function OtpDemo() {
  const [value, setValue] = useState("");
  return (
    <Spec label="Input OTP" hint="input-otp · controlled">
      <InputOTP maxLength={6} value={value} onChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </Spec>
  );
}

export function PasswordStrengthDemo() {
  const [pw, setPw] = useState("");
  return (
    <Spec label="Password strength" hint="shared · live estimate">
      <div className="space-y-2">
        <Label htmlFor="ref-pw">New password</Label>
        <Input
          id="ref-pw"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Type to preview the meter"
        />
        <PasswordStrengthMeter value={pw} />
      </div>
    </Spec>
  );
}
