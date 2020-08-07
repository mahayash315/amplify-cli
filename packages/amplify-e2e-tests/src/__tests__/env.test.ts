import {
  addAuthWithDefault,
  amplifyPull,
  amplifyPushUpdate,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import {
  addEnvironment,
  checkoutEnvironment,
  getEnvironment,
  importEnvironment,
  listEnvironment,
  pullEnvironment,
  removeEnvironment,
} from '../environment/env';

async function validate(meta: any) {
  expect(meta.providers.awscloudformation).toBeDefined();
  const { AuthRoleArn: authRoleArn, DeploymentBucketName: bucketName, Region: region, StackId: stackId } = meta.providers.awscloudformation;

  expect(authRoleArn).toBeDefined();
  expect(region).toBeDefined();
  expect(stackId).toBeDefined();
  const bucketExists = await checkIfBucketExists(bucketName, region);
  expect(bucketExists).toMatchObject({});
}

describe('environment commands', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('env-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add environments, list them, then remove them', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'enva' });
    await listEnvironment(projRoot, {});
    await addEnvironment(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, { numEnv: 2 });
    await checkoutEnvironment(projRoot, { envName: 'enva' });
    await removeEnvironment(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, {});

    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });

  it('init a project, pull, add auth, pull to override auth change', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await amplifyPull(projRoot, { override: false });
    await addAuthWithDefault(projRoot, {});
    await amplifyPull(projRoot, { override: true });

    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });
});

/* Disabling test for now */
describe.skip('cross project environment commands', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('import-env-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init two projects, get and import environment from one to the other', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'env' });
    await addAuthWithDefault(projRoot, {});
    const providerConfig: string = await getEnvironment(projRoot, { envName: 'env' });
    expect(providerConfig === JSON.stringify(JSON.parse(providerConfig))).toBeTruthy();
    await amplifyPushUpdate(projRoot);
    let projRoot2: string;
    try {
      projRoot2 = await createNewProjectDir('import-env-test2');
      await initJSProjectWithProfile(projRoot2, {});
      await importEnvironment(projRoot2, { providerConfig, envName: 'env' });
      await validate(getProjectMeta(projRoot));
      await validate(getProjectMeta(projRoot2));
    } catch (e) {
      console.error(e);
    } finally {
      await deleteProject(projRoot2);
      deleteProjectDir(projRoot2);
    }
  });
});