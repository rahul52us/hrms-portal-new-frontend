"use client";
import React from "react";
import UsersView from "./UsersView";
import ManagerApprovalInbox from "@/app/component/approvals/ManagerApprovalInbox";
import stores from "@/app/store/stores";
import { Stack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
// import UsersView from "./UsersView";

const UsersPage = observer(() => {
  return <Stack spacing={5}>{stores.auth.sessionReady && stores.auth.user?.role === "admin" ? <ManagerApprovalInbox /> : null}<UsersView /></Stack>;
});

export default UsersPage;
