import { Future, Option } from "@swan-io/boxed";
import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Ref, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import {
  CompleteAddressWithContactInput,
  GetEligibleCardMembershipsQuery,
} from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";
import { validateAddress } from "../utils/validations";
import { Address, CardWizardAddressForm } from "./CardWizardAddressForm";
import { CardWizardChoosePinModal } from "./CardWizardChoosePinModal";

const getAddress = (address: CompleteAddressWithContactInput | undefined, index: number) => {
  if(!address) {
    return null
  }

  return [{
  addressLine1: address.addressLine1 ?? "",
  addressLine2: address.addressLine2 ?? undefined,
  postalCode: address.postalCode ?? '',
  city: address.city ?? '',
  state: address.state ?? undefined,
  country: address.country as CountryCCA3 ?? 'FRA',
}, index] as [Address, number];
};

const styles = StyleSheet.create({
  erroredTile: {
    borderColor: colors.negative[100],
    borderWidth: 1,
  },
});

type Member = GetNode<NonNullable<GetEligibleCardMembershipsQuery["accountMemberships"]>>;

type CardIndividualDeliveryConfig = {
  address: CompleteAddressWithContactInput;
  member: Member;
  choosePin: boolean;
}[];

export type CardWizardIndividualDeliveryRef = {
  submit: () => void;
};

type Props = {
  ref?: Ref<CardWizardIndividualDeliveryRef>;
  members: Member[];
  address?: CompleteAddressWithContactInput;
  onSubmit: (cardDeliveryConfig: CardIndividualDeliveryConfig) => Future<unknown>;
};

type PropsWithAddress = {
  ref?: Ref<CardWizardIndividualDeliveryRef>;
  members: Member[];
  address: CompleteAddressWithContactInput;
  onSubmit: (cardDeliveryConfig: CardIndividualDeliveryConfig) => void;
};

const CardWizardIndividualDeliveryWithAddress = ({
  ref,
  members,
  address,
  onSubmit,
}: PropsWithAddress) => {
  const [currentCardIndividualDeliveryConfig, setCardIndividualDeliveryConfig] =
    useState<CardIndividualDeliveryConfig>(() =>
      members.map(member => ({ member, address, choosePin: false })),
    );

  const [editingAddress, setEditingAddress] = useState<[Address, number] | null>(getAddress(currentCardIndividualDeliveryConfig[0]?.address, 0));
    
  const hasSomeError = currentCardIndividualDeliveryConfig.some(config =>
    validateAddress(config.address),
  );

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        if (!hasSomeError) {
          onSubmit(currentCardIndividualDeliveryConfig);
        }
      },
    }),
    [currentCardIndividualDeliveryConfig, hasSomeError, onSubmit],
  );

  return (
    <View>
      {currentCardIndividualDeliveryConfig.map((config, index) => {
        return (
          <View key={config.member.id}>
            <Tile
              style={hasSomeError ? styles.erroredTile : null}
              footer={
                hasSomeError ? (
                  <LakeAlert
                    anchored={true}
                    variant="error"
                    title={t("cardWizard.address.invalid")}
                  />
                ) : null
              }
            >
              <Box direction="row" alignItems="center">
                <Avatar size={28} user={config.member.user} />
                <Space width={24} />

                <View style={commonStyles.fill}>
                  <LakeText variant="semibold" color={colors.gray[900]}>
                    {getMemberName({ accountMembership: config.member })}
                  </LakeText>

                  <LakeText>{config.address.addressLine1}</LakeText>

                  {config.address.addressLine2 != null ? (
                    <LakeText>{config.address.addressLine2}</LakeText>
                  ) : null}

                  <LakeText>
                    {`${config.address.postalCode} ${config.address.city} ${
                      config.address.state ?? ""
                    } ${config.address.country}`.trim()}
                  </LakeText>
                </View>

                <Fill minWidth={24} />

                <LakeButton
                  mode="tertiary"
                  onPress={() =>
                    setEditingAddress(getAddress(config.address, index))
                  }
                >
                  {t("cardWizard.address.change")}
                </LakeButton>
              </Box>
            </Tile>

            <Space height={16} />
          </View>
        );
      })}

      <LakeModal visible={editingAddress != null} title={t("cardWizard.address.changeAddress")}>
        {(() => {
          if (editingAddress != null) {
            const [initialAddress, editingIndex] = editingAddress;

            return (
              <CardWizardAddressForm
                initialAddress={initialAddress}
                onSubmit={address => {
                  setCardIndividualDeliveryConfig(
                    currentCardIndividualDeliveryConfig.map((item, index) => {
                      if (editingIndex !== index) {
                        return item;
                      }
                      return {
                        ...item,
                        address: {
                          firstName: item.address.firstName,
                          lastName: item.address.lastName,
                          phoneNumber: item.address.phoneNumber,
                          ...address,
                        },
                      };
                    }),
                  );
                  setEditingAddress(null);
                }}
                onPressClose={() => setEditingAddress(null)}
              />
            );
          }
          return null;
        })()}
      </LakeModal>
    </View>
  );
};

export const CardWizardIndividualDelivery = ({ ref, members, address, onSubmit }: Props) => {
  const [choosePinModal, setChoosePinModal] = useState<Option<CardIndividualDeliveryConfig>>(
    Option.None(),
  );

  return (
    <>
      {address != null ? (
        <CardWizardIndividualDeliveryWithAddress
          ref={ref}
          members={members}
          address={address}
          onSubmit={value => {
            setChoosePinModal(Option.Some(value));
          }}
        />
      ) : (
        <Tile>
          <CardWizardAddressForm
            ref={ref}
            initialAddress={{ addressLine1: "", postalCode: "", city: "" }}
            showButtons={false}
            onSubmit={address => {
              const config = members.map(member => ({
                member,
                address: {
                  ...address,
                  firstName: member.user?.firstName ?? "",
                  lastName: member.user?.preferredLastName ?? "",
                  phoneNumber: member.user?.mobilePhoneNumber ?? "",
                },
                choosePin: false,
              }));
              setChoosePinModal(Option.Some(config));
            }}
          />
        </Tile>
      )}

      <CardWizardChoosePinModal
        visible={choosePinModal.isSome()}
        onPressClose={() => setChoosePinModal(Option.None())}
        onSubmit={({ choosePin }) =>
          match(choosePinModal)
            .with(Option.P.Some(P.select()), config => {
              return onSubmit(config.map(item => ({ ...item, choosePin })));
            })
            .otherwise(() => Future.value(undefined))
        }
      />
    </>
  );
};
