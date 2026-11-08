"use client";
import { useSyncExternalStore } from "react";
import { getBatchSize, subscribeBatchSize } from "@/features/sims/batchStore";
import CodeView from "@/features/sims/CodeView";

export default function BatchCode() {
  const n = useSyncExternalStore(subscribeBatchSize, getBatchSize, () => 3);
  const code = `@Bean\nStep importCustomers(JobRepository jobRepository,\n                     PlatformTransactionManager transactionManager) {\n  return new StepBuilder("importCustomers", jobRepository)\n    .<CsvRow, Customer>chunk(${n}, transactionManager)   // commit every ${n} items\n    .reader(csvReader)\n    .processor(cleanAndValidate)           // return null to skip\n    .writer(jdbcWriter)\n    .build();\n}`;
  return <CodeView text={code} hi={[4]} />;
}
