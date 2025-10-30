import Chip from '@mui/material/Chip';
import * as React from 'react';
import {
  Create,
  DataProviderContext,
  Datagrid,
  Edit,
  EditButton,
  FormDataConsumer,
  FunctionField,
  List,
  ReferenceField,
  ReferenceInput,
  ReferenceManyField,
  SaveButton,
  SearchInput,
  SelectInput,
  SimpleForm,
  SingleFieldList,
  TextField,
  TextInput,
  Toolbar,
  useRecordContext,
  useListContext,
  useUnique,
  required,
} from 'react-admin';
import { useCreateApiKey, useGenerateApiKey, useModifyApiKey } from '../lib/apiKey';
import CopyChip from '../ui/CopyChip';
import DeleteApiKeyButton from '../ui/DeleteApiKeyButton';
import ManagePermissions from '../ui/ManagePermissions';
import ManageRoles from '../ui/ManageRoles';
import Row from '../ui/Row';

import type { DataProvider, Identifier, RaRecord } from 'react-admin';

interface ActorFieldProps {
  record: RaRecord<Identifier>;
  label?: string;
}

interface ActorFieldState {
  record: {
    actorName?: string;
    actorType?: string;
    actorLink?: string;
  };
}

class ActorField extends React.Component<ActorFieldProps, ActorFieldState> {
  static contextType = DataProviderContext;
  declare context: DataProvider | undefined;

  constructor(props: ActorFieldProps) {
    super(props);
    this.state = { record: {} };
  }

  async componentDidMount(): Promise<void> {
    const dataProvider = this.context;
    if (!dataProvider) {
      return;
    }

    const actorLookups = [
      { resource: 'user', field: 'actor' },
      { resource: 'device', field: 'actor' },
      { resource: 'application', field: 'actor' },
    ] as const;

    await Promise.all(
      actorLookups.map(async (lookup) => {
        const result = await dataProvider.getList(lookup.resource, {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: 'id', order: 'ASC' },
          filter: { [lookup.field]: this.props.record['is of-actor'] },
        });

        if (result.data.length > 0) {
          const [{ username, id, ['app name']: appName, ['device name']: deviceName }] = result.data as Array<
            Record<string, any>
          >;
          const actorName = username ?? appName ?? deviceName ?? 'Unknown';
          const actorType = username ? 'User' : appName ? 'Fleet' : 'Device';
          const actorRecordType = username ? 'user' : appName ? 'application' : 'device';
          const actorLink = `/#/${actorRecordType}/${id}`;

          this.setState({
            record: {
              actorName,
              actorType,
              actorLink,
            },
          });
        }
      }),
    );
  }

  generateLabel(): string {
    const { actorType, actorName } = this.state.record;
    if (actorType && actorName) {
      return `${actorType}: ${actorName}`;
    }
    return 'Unassigned';
  }

  render(): React.ReactElement {
    return <Chip label={this.generateLabel()} href={this.state.record.actorLink} component='a' clickable />;
  }
}

const apiKeyFilters = [<SearchInput source='#key,name,description@ilike' alwaysOn />];

const CustomBulkActionButtons = (props) => {
  const { selectedIds } = useListContext();
  return (
    <React.Fragment>
      <DeleteApiKeyButton variant='contained' size='small' selectedIds={selectedIds} {...props}>
        Delete Selected API Keys
      </DeleteApiKeyButton>
    </React.Fragment>
  );
};

const ActorFieldWrapper: React.FC<Omit<ActorFieldProps, 'record'>> = (props) => {
  const record = useRecordContext<RaRecord<Identifier>>();
  if (!record) {
    return null;
  }
  return <ActorField {...props} record={record} />;
};

export const ApiKeyList = () => {
  return (
    <List filters={apiKeyFilters}>
      <Datagrid size='medium' rowClick={false} bulkActionButtons={<CustomBulkActionButtons />}>
        <FunctionField
          label='API Key'
          render={(record) => <CopyChip title={record.key} label={record.key.slice(0, 10) + '...'} />}
        />

        <TextField label='Name' source='name' />
        <ActorFieldWrapper label='Assigned To' />

        <ReferenceManyField label='Roles' source='id' reference='api key-has-role' target='api key'>
          <SingleFieldList linkType={false}>
            <ReferenceField source='role' reference='role' target='id'>
              <TextField source='name' />
            </ReferenceField>
          </SingleFieldList>
        </ReferenceManyField>

        <Toolbar style={{ minHeight: 0, minWidth: 0, padding: 0, margin: 0, background: 0, textAlign: 'center' }}>
          <EditButton label='' size='small' variant='outlined' />
          <DeleteApiKeyButton size='small' variant='outlined' />
        </Toolbar>
      </Datagrid>
    </List>
  );
};

export const ApiKeyCreate = (props) => {
  const generateApiKey = useGenerateApiKey();
  const createApiKey = useCreateApiKey();
  const unique = useUnique();

  return (
    <Create {...props} transform={createApiKey}>
      <SimpleForm>
        <TextInput
          source='key'
          defaultValue={generateApiKey()}
          size='large'
          fullWidth={true}
          validate={[required(), unique()]}
          readOnly={true}
        />

        <Row>
          {' '}
          <TextInput source='name' size='large' validate={[required(), unique()]} />
          <TextInput source='description' size='large' />
        </Row>

        <Row>
          <FormDataConsumer>
            {({ formData, ...rest }) => {
              const disable = !!(formData.deviceActor || formData.fleetActor);
              return (
                <ReferenceInput source='userActor' reference='user' {...rest}>
                  <SelectInput optionText='username' optionValue='actor' resettable disabled={disable} />
                </ReferenceInput>
              );
            }}
          </FormDataConsumer>

          <FormDataConsumer>
            {({ formData, ...rest }) => {
              const disable = !!(formData.userActor || formData.fleetActor);
              return (
                <ReferenceInput source='deviceActor' reference='device' {...rest}>
                  <SelectInput optionText='device name' optionValue='actor' resettable disabled={disable} />
                </ReferenceInput>
              );
            }}
          </FormDataConsumer>

          <FormDataConsumer>
            {({ formData, ...rest }) => {
              const disable = !!(formData.userActor || formData.deviceActor);
              return (
                <ReferenceInput source='fleetActor' reference='application' {...rest}>
                  <SelectInput optionText='app name' optionValue='actor' resettable disabled={disable} />
                </ReferenceInput>
              );
            }}
          </FormDataConsumer>
        </Row>
      </SimpleForm>
    </Create>
  );
};

const CustomToolbar = (props) => {
  const { alwaysEnableSaveButton = false, ...rest } = props;
  return (
    <Toolbar {...rest} style={{ justifyContent: 'space-between', marginTop: '40px' }}>
      <SaveButton alwaysEnable={alwaysEnableSaveButton} sx={{ flex: 1 }} />
      <DeleteApiKeyButton sx={{ flex: 0.3, marginLeft: '40px' }}> Delete </DeleteApiKeyButton>
    </Toolbar>
  );
};

export const ApiKeyEdit = () => {
  const modifyApiKey = useModifyApiKey();

  return (
    <Edit
      title='Edit API Key'
      transform={modifyApiKey}
      sx={{
        '> div > div': {
          maxWidth: '900px !important',
        },
      }}
    >
      <SimpleForm toolbar={<CustomToolbar />}>
        <TextInput source='key' size='large' fullWidth={true} validate={required()} readOnly={true} />

        <Row>
          <TextInput source='name' size='large' validate={required()} />
          <TextInput source='description' size='large' />
        </Row>

        <ManagePermissions source='permissionArray' reference='api key-has-permission' target='api key' />
        <ManageRoles source='roleArray' reference='api key-has-role' target='api key' />
      </SimpleForm>
    </Edit>
  );
};

const apiKey = {
  list: ApiKeyList,
  create: ApiKeyCreate,
  edit: ApiKeyEdit,
};

export default apiKey;
