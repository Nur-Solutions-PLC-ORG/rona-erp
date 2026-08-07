import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminService } from '../service/admin.service';

@Controller('api/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard endpoint
  @Get('dashboard')
  async getDashboard(): Promise<any> {
    const result = await this.adminService.getDashboardStats();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Dashboard stats retrieved successfully',
      data: result,
    };
  }

  // Users endpoints
  @Get('users')
  async getUsers(@Query() query: any): Promise<any> {
    const result = await this.adminService.getUsers(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data: result,
    };
  }

  @Post('users')
  async createUser(@Body() body: any): Promise<any> {
    const result = await this.adminService.createUser(body);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      data: result,
    };
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string): Promise<any> {
    const result = await this.adminService.getUserById(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: result,
    };
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any): Promise<any> {
    const result = await this.adminService.updateUser(id, body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: result,
    };
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string): Promise<any> {
    await this.adminService.deleteUser(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User deleted successfully',
    };
  }

  // Companies endpoints
  @Get('companies')
  async getCompanies(@Query() query: any): Promise<any> {
    const result = await this.adminService.getCompanies(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Companies retrieved successfully',
      data: result,
    };
  }

  @Post('companies')
  async createCompany(@Body() body: any): Promise<any> {
    const result = await this.adminService.createCompany(body);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Company created successfully',
      data: result,
    };
  }

  @Get('companies/:id')
  async getCompanyById(@Param('id') id: string): Promise<any> {
    const result = await this.adminService.getCompanyById(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Company retrieved successfully',
      data: result,
    };
  }

  @Patch('companies/:id')
  async updateCompany(
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<any> {
    const result = await this.adminService.updateCompany(id, body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Company updated successfully',
      data: result,
    };
  }

  @Delete('companies/:id')
  async deleteCompany(@Param('id') id: string): Promise<any> {
    await this.adminService.deleteCompany(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Company deleted successfully',
    };
  }

  // Company Settings endpoints
  @Get('company-settings')
  async getCompanySettings(@Query() query: any): Promise<any> {
    const result = await this.adminService.getCompanySettings(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Company settings retrieved successfully',
      data: result,
    };
  }

  @Post('company-settings')
  async createCompanySettings(@Body() body: any): Promise<any> {
    const result = await this.adminService.createCompanySettings(body);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Company settings created successfully',
      data: result,
    };
  }

  @Get('company-settings/:id')
  async getCompanySettingsById(@Param('id') id: string): Promise<any> {
    const result = await this.adminService.getCompanySettingsById(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Company settings retrieved successfully',
      data: result,
    };
  }

  @Patch('company-settings/:id')
  async updateCompanySettings(
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<any> {
    const result = await this.adminService.updateCompanySettings(id, body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Company settings updated successfully',
      data: result,
    };
  }

  @Delete('company-settings/:id')
  async deleteCompanySettings(@Param('id') id: string): Promise<any> {
    await this.adminService.deleteCompanySettings(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Company settings deleted successfully',
    };
  }

  // Departments endpoints
  @Get('departments')
  async getDepartments(@Query() query: any): Promise<any> {
    const result = await this.adminService.getDepartments(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Departments retrieved successfully',
      data: result,
    };
  }

  @Post('departments')
  async createDepartment(@Body() body: any): Promise<any> {
    const result = await this.adminService.createDepartment(body);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Department created successfully',
      data: result,
    };
  }

  @Get('departments/:id')
  async getDepartmentById(@Param('id') id: string): Promise<any> {
    const result = await this.adminService.getDepartmentById(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Department retrieved successfully',
      data: result,
    };
  }

  @Patch('departments/:id')
  async updateDepartment(
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<any> {
    const result = await this.adminService.updateDepartment(id, body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Department updated successfully',
      data: result,
    };
  }

  @Delete('departments/:id')
  async deleteDepartment(@Param('id') id: string): Promise<any> {
    await this.adminService.deleteDepartment(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Department deleted successfully',
    };
  }

  // Branches endpoints
  @Get('branches')
  async getBranches(@Query() query: any): Promise<any> {
    const result = await this.adminService.getBranches(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Branches retrieved successfully',
      data: result,
    };
  }

  @Post('branches')
  async createBranch(@Body() body: any): Promise<any> {
    const result = await this.adminService.createBranch(body);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Branch created successfully',
      data: result,
    };
  }

  @Get('branches/:id')
  async getBranchById(@Param('id') id: string): Promise<any> {
    const result = await this.adminService.getBranchById(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Branch retrieved successfully',
      data: result,
    };
  }

  @Patch('branches/:id')
  async updateBranch(@Param('id') id: string, @Body() body: any): Promise<any> {
    const result = await this.adminService.updateBranch(id, body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Branch updated successfully',
      data: result,
    };
  }

  @Delete('branches/:id')
  async deleteBranch(@Param('id') id: string): Promise<any> {
    await this.adminService.deleteBranch(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Branch deleted successfully',
    };
  }

  // Employees endpoints
  @Get('employees')
  async getEmployees(@Query() query: any): Promise<any> {
    const result = await this.adminService.getEmployees(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employees retrieved successfully',
      data: result,
    };
  }

  @Post('employees')
  async createEmployee(@Body() body: any): Promise<any> {
    const result = await this.adminService.createEmployee(body);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Employee created successfully',
      data: result,
    };
  }

  @Get('employees/:id')
  async getEmployeeById(@Param('id') id: string): Promise<any> {
    const result = await this.adminService.getEmployeeById(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee retrieved successfully',
      data: result,
    };
  }

  @Patch('employees/:id')
  async updateEmployee(
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<any> {
    const result = await this.adminService.updateEmployee(id, body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee updated successfully',
      data: result,
    };
  }

  @Delete('employees/:id')
  async deleteEmployee(@Param('id') id: string): Promise<any> {
    await this.adminService.deleteEmployee(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee deleted successfully',
    };
  }

  // Platform Configs endpoints
  @Get('platform-configs')
  async getPlatformConfigs(): Promise<any> {
    const result = await this.adminService.getPlatformConfigs();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Platform configs retrieved successfully',
      data: result,
    };
  }

  @Patch('platform-configs')
  async updatePlatformConfig(@Body() body: any): Promise<any> {
    const result = await this.adminService.updatePlatformConfig(body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Platform config updated successfully',
      data: result,
    };
  }

  @Get('platform-configs/:key')
  async getPlatformConfigByKey(@Param('key') key: string): Promise<any> {
    const result = await this.adminService.getPlatformConfigByKey(key);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Platform config retrieved successfully',
      data: result,
    };
  }

  // Role Management endpoints
  @Get('users/:userId/roles')
  async getUserRoles(@Param('userId') userId: string): Promise<any> {
    const result = await this.adminService.getUserRoles(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User roles retrieved successfully',
      data: result,
    };
  }

  @Patch('users/:userId/roles')
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: any,
  ): Promise<any> {
    const result = await this.adminService.updateUserRole(userId, body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User role updated successfully',
      data: result,
    };
  }

  @Delete('users/:userId/roles')
  async deleteUserRole(@Param('userId') userId: string): Promise<any> {
    await this.adminService.deleteUserRole(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User role deleted successfully',
    };
  }
}
