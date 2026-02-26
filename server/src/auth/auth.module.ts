//  ----- 📖 Library 📖 -----
import { forwardRef, Module } from '@nestjs/common';

//  ----- 💼 Module 💼 -----
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

//  ----- 🔗 Controllers 🔗 -----
import { AuthController } from 'src/auth/auth.controller';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { AuthService } from 'src/auth/auth.service';
import { DatabaseService } from 'src/database/database.service';
import { JwtStrategy } from 'src/auth/guard/jwt.strategy';
import { EmployeesModule } from '../apis/employees/employees.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET, //  🔑 jwt key
      signOptions: { expiresIn: process.env.JWT_EXP }, //  ⌚ jwt time expires
    }),
    forwardRef(() => EmployeesModule),
  ],
  controllers: [AuthController],
  providers: [DatabaseService, JwtStrategy, AuthService],
  exports: [AuthService],
})
export class AuthModule {}
