"use client";

import {
  initializePaddle,
  type Paddle,
  type CheckoutEventsData,
  type CheckoutEventNames,
} from "@paddle/paddle-js";
import { useEffect, useRef, useState } from "react";

export type PaddleEventName = CheckoutEventNames | string;
export type PaddleCheckoutData = CheckoutEventsData;

type EventHandler = (eventName: PaddleEventName, data?: PaddleCheckoutData) => void;

/**
 * Initialises Paddle.js and exposes event handlers via a mutable ref
 * so the campaign page can react to checkout.completed / checkout.closed.
 */
export function usePaddle() {
  const [paddle, setPaddle] = useState<Paddle>();
  const handlerRef = useRef<EventHandler | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return;

    initializePaddle({
      environment:
        (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production") ||
        "sandbox",
      token,
      eventCallback: (event) => {
        if (handlerRef.current && event.name) {
          handlerRef.current(
            event.name,
            event.data as PaddleCheckoutData | undefined
          );
        }
      },
    }).then((instance) => {
      if (instance) setPaddle(instance);
    });
  }, []);

  /** Register a handler for Paddle checkout events. */
  function onEvent(handler: EventHandler) {
    handlerRef.current = handler;
  }

  /** Clear the event handler. */
  function offEvent() {
    handlerRef.current = null;
  }

  return { paddle, onEvent, offEvent };
}
