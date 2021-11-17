import { SendOutlined } from '@ant-design/icons';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import { Button, Input, Tooltip } from 'antd';
import { useEnsResolveName } from 'eth-hooks/dapps';
import { ethers } from 'ethers';
import React, { FC, useCallback, useContext, useState } from 'react';
import Blockies from 'react-blockies';

import { Wallet } from '.';

import { transactor } from '~~/functions';
import { EthComponentsContext } from '~~/models';

// improved a bit by converting address to ens if it exists
// added option to directly input ens name
// added placeholder option

interface IFaucetProps {
  faucetAddress?: string;
  price: number;
  mainnetProvider: StaticJsonRpcProvider;
  placeholder?: string;
  localProvider: StaticJsonRpcProvider;
}

/**
 * Displays a local faucet to send ETH to given address, also wallet is provided
 * 
 * ~ Features ~

  - Provide price={price} of ether and convert between USD and ETH in a wallet
  - Provide localProvider={localProvider} to be able to send ETH to given address
  - Provide ensProvider={mainnetProvider} and your address will be replaced by ENS name
              (ex. "0xa870" => "user.eth") or you can enter directly ENS name instead of address
              works both in input field & wallet
  - Provide placeholder="Send local faucet" value for the input
 * @param props 
 * @returns (FC)
 */
export const Faucet: FC<IFaucetProps> = (props) => {
  const [recipient, setRecipient] = useState<string>('');
  const context = useContext(EthComponentsContext);

  let blockie;
  if (props.faucetAddress && typeof props.faucetAddress.toLowerCase === 'function') {
    blockie = <Blockies seed={props.faucetAddress.toLowerCase()} size={8} scale={4} />;
  } else {
    blockie = <div />;
  }

  const updateAddress = useCallback((newValue: string) => {
    if (newValue != null) {
      // const result = '';
      // try {
      //   if (newValue.indexOf('.eth') > 0 || newValue.indexOf('.xyz') > 0) {
      //     const possibleName = await props.mainnetProvider.resolveName(newValue);
      //     if (!!possibleName) {
      //       result = possibleName;
      //     }
      //   } else {
      //     result = newValue;
      //   }
      // } catch (e) {
      //   result = newValue;
      // }


      setRecipient(newValue);
    }
  }, []);

  const resolvedAddress = useEnsResolveName(props.mainnetProvider, recipient ?? '');
  const toAddress = ethers.utils.isAddress(recipient) ? recipient : resolvedAddress;
  const localSigner = props.localProvider.getSigner();

  return (
    <span>
      <Input
        size="large"
        placeholder={props.placeholder ? props.placeholder : 'local faucet'}
        prefix={blockie}
        // value={address}
        value={recipient}
        onChange={(e): void => {
          // setAddress(e.target.value);
          void updateAddress(e.target.value);
        }}
        suffix={
          <Tooltip title="Faucet: Send local ether to an address.">
            <Button
              onClick={(): void => {
                if (localSigner && context && ethers.utils.isAddress(toAddress)) {
                  const tx = transactor(context, localSigner);

                  if (tx && !!recipient) {
                    void tx({
                      to: toAddress,
                      value: parseEther('0.01'),
                    }).then(() => {
                      setRecipient('');
                    });
                  }
                } else {
                  console.warn('Faucet: invalid address');
                }
              }}
              shape="circle"
              icon={<SendOutlined />}
            />
            <Wallet
              color="#888888"
              signer={localSigner}
              localProvider={props.localProvider}
              ensProvider={props.mainnetProvider}
              price={props.price}
            />
          </Tooltip>
        }
      />
    </span>
  );
};
