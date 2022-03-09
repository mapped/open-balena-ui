import * as React from "react";
import {
    Create,
    Edit,
    TextField,
    Datagrid,
    ReferenceManyField,
    SingleFieldList,
    ChipField,
    List,
    SimpleForm,
    TextInput,
} from 'react-admin';

const DeviceTitle = ({ record }) => {
    return <span>Device {record ? `"${record.name}"` : ''}</span>;
};

export const DeviceList = (props) => {
    return (
        <List {...props}>
            <Datagrid rowClick="edit">
                <TextField source="id" />
                <TextField label="UUID" source="uuid" />
                <TextField label="Name" source="device name" />
                <ReferenceManyField label="Fleet" source="belongs to-application" reference="application" target="id">
                    <SingleFieldList>
                        <ChipField source="app name" />
                    </SingleFieldList>
                </ReferenceManyField>
                <ReferenceManyField label="Device Type" source="is of-device type" reference="device type" target="id">
                    <SingleFieldList>
                        <ChipField source="slug" />
                    </SingleFieldList>
                </ReferenceManyField>
                <ReferenceManyField label="Installed Services" source="id" reference="service install" target="device">
                    <SingleFieldList>
                        <ReferenceManyField source="installs-service" reference="service" target="id">
                        <SingleFieldList>
                            <ChipField source="service name" />
                        </SingleFieldList>
                        </ReferenceManyField>
                    </SingleFieldList>
                </ReferenceManyField>
            </Datagrid>
        </List>
    )
};

export const DeviceCreate = props => (
    <Create {...props}>
        <SimpleForm>
            <TextInput source="uuid" />
            <TextInput source="device name" />
        </SimpleForm>
    </Create>
);

export const DeviceEdit = props => (
    <Edit title={<DeviceTitle />} {...props}>
        <SimpleForm>
            <TextInput disabled source="id" />
            <TextInput source="uuid" />
            <TextInput source="device name" />
        </SimpleForm>
    </Edit>
);

const device = {
    list: DeviceList,
    create: DeviceCreate,
    edit: DeviceEdit
}

export default device;