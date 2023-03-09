import { SimpleHeaderCell } from "@swan-io/lake/src/components/FixedListViewCells";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ReactNode } from "react";
import { TransactionDetailsFragment } from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  TransactionAmountCell,
  TransactionExecutionDateCell,
  TransactionNameCell,
} from "./TransactionListCells";

type Props = {
  pageSize: number;
  transactions: { node: TransactionDetailsFragment }[];
  onEndReached: () => void;
  renderEmptyList: () => ReactNode;
  loading?: {
    isLoading: boolean;
    count: number;
  };
};

type ExtraInfo = undefined;

const columns: ColumnConfig<TransactionDetailsFragment, ExtraInfo>[] = [
  {
    id: "label",
    width: "grow",
    title: "label",
    renderTitle: () => null,
    renderCell: ({ item }) => <TransactionNameCell transaction={item} />,
  },
  {
    id: "date",
    width: 200,
    title: t("transactions.date"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => <TransactionExecutionDateCell transaction={item} />,
  },
  {
    id: "amount",
    width: 160,
    title: t("transactions.amount"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => <TransactionAmountCell transaction={item} />,
  },
];

export const RightPanelTransactionList = ({
  transactions,
  loading,
  onEndReached,
  renderEmptyList,
}: Props) => {
  return (
    <PlainListView
      data={transactions.map(({ node }) => node)}
      keyExtractor={item => item.id}
      headerHeight={48}
      rowHeight={56}
      groupHeaderHeight={48}
      extraInfo={undefined}
      columns={columns}
      onEndReached={onEndReached}
      loading={loading}
      renderEmptyList={renderEmptyList}
    />
  );
};
