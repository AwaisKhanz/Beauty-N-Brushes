'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit,
  Eye,
  MoreHorizontal,
  DollarSign,
  Clock,
  Star,
  Package,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ServicesPage() {
  // Mock data - replace with real data from API
  const services = [
    {
      id: '1',
      title: 'Hair Color & Cut',
      category: 'Hair Services',
      price: 150,
      duration: 120,
      status: 'active',
      bookings: 12,
      rating: 4.8,
      lastUpdated: '2025-01-15',
    },
    {
      id: '2',
      title: 'Bridal Makeup',
      category: 'Makeup Services',
      price: 200,
      duration: 90,
      status: 'active',
      bookings: 8,
      rating: 4.9,
      lastUpdated: '2025-01-10',
    },
    {
      id: '3',
      title: 'Nail Art Design',
      category: 'Nail Services',
      price: 75,
      duration: 60,
      status: 'draft',
      bookings: 0,
      rating: null,
      lastUpdated: '2025-01-16',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your service offerings and pricing</p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/provider/services/create">
            <Plus className="h-4 w-4" />
            Create Service
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">
              {services.filter((s) => s.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.reduce((sum, s) => sum + s.bookings, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter((s) => s.rating).length > 0
                ? (
                    services.filter((s) => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) /
                    services.filter((s) => s.rating).length
                  ).toFixed(1)
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Based on reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Service Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length)}
            </div>
            <p className="text-xs text-muted-foreground">Per service</p>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Services</CardTitle>
              <CardDescription>Manage and track your service offerings</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search services..." className="pl-8 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Updated {new Date(service.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {service.price}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {service.duration}min
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{service.bookings} bookings</div>
                  </TableCell>
                  <TableCell>
                    {service.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span className="text-sm">{service.rating}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No reviews</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/provider/services/${service.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/provider/services/${service.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Service
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {service.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {services.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No services yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first service to start receiving bookings
              </p>
              <Button asChild>
                <Link href="/provider/services/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Service
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
